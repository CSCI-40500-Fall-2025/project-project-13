from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Cookie, Header, HTTPException, Depends
from ...models.users import User
from .request_models import HeaderParams
from ...db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os
from typing import Optional
from starlette.responses import JSONResponse, Response


load_dotenv()
ENV = os.getenv("ENV", "development")
ALGORITHM = "RS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_MINUTES = 60

# ---------------------------
# Load keys from environment
# ---------------------------
def load_keys_from_env():
    try:
        return {
            "latest": {
                "private": os.environ["JWT_PRIVATE_KEY_LATEST"].replace("\\n", "\n"),
                "public": os.environ["JWT_PUBLIC_KEY_LATEST"].replace("\\n", "\n")
            },
            "previous": {
                "private": os.environ["JWT_PRIVATE_KEY_PREVIOUS"].replace("\\n", "\n"),
                "public": os.environ["JWT_PUBLIC_KEY_PREVIOUS"].replace("\\n", "\n")
            }
        }
    except KeyError as e:
        raise RuntimeError(f"Missing environment variable: {e}")

KEYPAIRS = load_keys_from_env()

# ---------------------------
# JWT helpers
# ---------------------------
def create_jwt(payload: dict, token_type: str, expires_delta: timedelta):
    private_key = KEYPAIRS["latest"]["private"]
    expire = datetime.now(timezone.utc) + expires_delta
    payload.update({"exp": expire, "type": token_type})
    return jwt.encode(payload, private_key, algorithm=ALGORITHM)


def decode_jwt(token: str, expected_type: str):
    errors = []
    for label in ("latest", "previous"):
        try:
            public_key = KEYPAIRS[label]["public"]
            payload = jwt.decode(token, public_key, algorithms=[ALGORITHM])
            if payload.get("type") != expected_type:
                print("invalid token type")
                raise HTTPException(status_code=401, detail="Invalid token type")
            return payload  # success
        except JWTError as e:
            print(f"JWTError with {label} key:", e)
            errors.append(f"{label}: {str(e)}")

    print("All JWT decode attempts failed:", errors)
    raise HTTPException(status_code=401, detail="Invalid token (tried both keys)")

# ---------------------------
# Password helpers
# ---------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hashify(password: str) -> str:
    return pwd_context.hash(password)

def verify(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ---------------------------
# Header helpers
# ---------------------------


def update_headers(response: Response, tokens: dict) -> Response:
    """
    Set cookies on the existing Response object (works with StreamingResponse).
    Returns the same Response instance for further handling.
    """
    secure = True if ENV == "production" else False
    samesite = "None"  # you chose None in dev — OK for cross-site if Secure True in prod

    # Use response.set_cookie directly rather than constructing a new JSONResponse
    response.set_cookie(
        key="Authorization",
        value=tokens["access_token"],
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=60 * 15,
        path="/",
    )
    response.set_cookie(
        key="X-Refresh-Token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=60 * 60 * 24 * 30,
        path="/",
    )
    response.set_cookie(
        key="X-User-ID",
        value=str(tokens["user_id"]),
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=60 * 60 * 24 * 30,
        path="/",
    )
    return response

async def get_headers(
    access_token_cookie: Optional[str] = Cookie(None, alias="Authorization"),
    refresh_token_cookie: Optional[str] = Cookie(None, alias="X-Refresh-Token"),
    user_id_cookie: Optional[str] = Cookie(None, alias="X-User-ID"),
    access_token_header: Optional[str] = Header(None, alias="Authorization"),
    refresh_token_header: Optional[str] = Header(None, alias="X-Refresh-Token"),
    user_id_header: Optional[str] = Header(None, alias="X-User-ID"),
) -> HeaderParams:
    """
    Resolves tokens for either web (cookies) OR mobile (headers), but not both.
    Raises an error if tokens are missing or mixed.
    """

    # Determine which method is being used
    using_cookies = access_token_cookie or refresh_token_cookie or user_id_cookie
    using_headers = access_token_header or refresh_token_header or user_id_header

    # Enforce only one method per request
    if using_cookies and using_headers:
        raise HTTPException(status_code=400, detail="Not allowed")
    if not using_cookies and not using_headers:
        raise HTTPException(status_code=401, detail="Missing authentication tokens")

    if using_headers:
        return HeaderParams(
            access_token=access_token_header,
            refresh_token=refresh_token_header,
            user_id=user_id_header
        )
    else:
        return HeaderParams(
            access_token=access_token_cookie,
            refresh_token=refresh_token_cookie,
            user_id=user_id_cookie
        )
async def update_tokens(
    headers: HeaderParams,
    db: AsyncSession = Depends(get_db)
) -> dict:
    try:
        # Try decoding access token first
        access_payload = None
        access_valid = False
        try:
            access_payload = decode_jwt(headers.access_token, expected_type="access")
            access_valid = True
        except HTTPException:
            access_valid = False

        # Try decoding refresh token
        refresh_payload = None
        refresh_valid = False
        try:
            refresh_payload = decode_jwt(headers.refresh_token, expected_type="refresh")
            refresh_valid = True
        except HTTPException:
            refresh_valid = False

        if not refresh_valid:
            raise HTTPException(status_code=401, detail="Session expired. Please log in again.")

        # normalize user id to string for comparisons and DB usage
        user_id = refresh_payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token payload")
        user_id_str = str(user_id)

        # Match user_id from token with header cookie
        if str(headers.user_id) != user_id_str:
            raise HTTPException(status_code=401, detail="User ID mismatch")

        if access_valid:
            # normalize access token subject and compare
            access_sub = str(access_payload.get("sub")) if access_payload is not None else None
            if access_sub is None or access_sub != user_id_str:
                raise HTTPException(status_code=401, detail="User ID mismatch (access token)")

        # Fetch user from DB (use integer id if your DB id is integer)
        try:
            user_pk = int(user_id_str)
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid user id in token")

        result = await db.execute(select(User).where(User.id == user_pk))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Ensure the stored refresh token matches the one sent
        if user.refresh != headers.refresh_token:
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        # If access is still valid, only reissue access token
        if access_valid:
            new_access_token = create_jwt(
                payload={"sub": user_id_str},
                token_type="access",
                expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
            )
            return {
                "access_token": new_access_token,
                "refresh_token": headers.refresh_token,  # Reuse old refresh
                "user_id": user_id_str
            }

        # Otherwise, reissue both tokens and rotate refresh token (ensure sub is string)
        new_access_token = create_jwt(
            payload={"sub": user_id_str},
            token_type="access",
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        )
        new_refresh_token = create_jwt(
            payload={"sub": user_id_str},
            token_type="refresh",
            expires_delta=timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES),
        )

        # Update user refresh token in DB
        user.refresh = new_refresh_token
        await db.commit()

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "user_id": user_id_str
        }

    except HTTPException:
        # let auth-related HTTPExceptions pass through unchanged
        raise
    except Exception as e:
        # log if you have logger, then return a clean message
        # logger.exception("update_tokens failed")
        raise HTTPException(status_code=401, detail=str(e))

def create_new_tokens(user_id: int) -> dict:
    new_access_token = create_jwt(
        payload={"sub": str(user_id)},
        token_type="access",
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    new_refresh_token = create_jwt(
        payload={"sub": str(user_id)},
        token_type="refresh",
        expires_delta=timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES),
    )                           
    return new_access_token, new_refresh_token
# def generate_verification_code():
#     generated_uuid = uuid.uuid1()
#     uuid_string = str(generated_uuid)
#     return uuid_string