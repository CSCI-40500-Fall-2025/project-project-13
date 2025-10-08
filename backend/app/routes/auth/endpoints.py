from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ...db import get_db
from ...models.users import User
from .logic import hashify, verify, create_new_tokens, update_headers
import random
import os
from datetime import datetime
from .request_models import LoginRequest, RegisterRequest, VerifyRequest, ResendRequest, HeaderParams
from .logic import ENV
from starlette.responses import JSONResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = body.email
    password = body.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token, refresh_token = create_new_tokens(user.id)

    # Save refresh token to DB
    user.refresh = refresh_token
    await db.commit()
    response = JSONResponse(content={"message": "Login successful"})    
    update_headers(
        response,
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user_id": user.id,
        }
    )
    print("RESPONSE:", response.headers)
    return response

     

@router.post("/logout")
def logout(response: Response):
    secure = True if ENV == "production" else False
    samesite = "None" 

    for key in ("Authorization", "X-Refresh-Token", "X-User-ID"):
        response.set_cookie(
            key=key,
            value="",
            httponly=True,
            secure=secure,
            samesite=samesite,
            path="/",
            max_age=0,
        )
    return {"detail": "Logged out"}

@router.post("/signup")
async def create_user(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = body.email
    password = body.password

    print("THIS IS THE PASSWORD", password)

    if not email or not password:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Check for duplicate email
    result = await db.execute(
        select(User).where(User.email == email)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Email already in use.")

    print("PASSWORD", password)
    new_user = User(
        email=email,
        password=hashify(password),
    )

    db.add(new_user)
    await db.flush()  
    await db.commit()

    return {
        "message": "User created successfully.",
    }




