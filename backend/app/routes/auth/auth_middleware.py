# app/routers/auth/auth_middleware.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request, HTTPException
from ...db import AsyncSessionLocal     
from .logic import get_headers, update_tokens, update_headers

class TokenRefreshMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # skip public endpoints
        if request.url.path.startswith(("/auth/login", "/auth/signup", "/auth/logout", "/docs", "/","/openapi.json")):
            return await call_next(request)

        # Use a fresh session for middleware tasks
        async with AsyncSessionLocal() as db:
            try:
                header_params = await get_headers(
                    access_token_cookie=request.cookies.get("Authorization"),
                    refresh_token_cookie=request.cookies.get("X-Refresh-Token"),
                    user_id_cookie=request.cookies.get("X-User-ID"),
                    access_token_header=request.headers.get("Authorization"),
                    refresh_token_header=request.headers.get("X-Refresh-Token"),
                    user_id_header=request.headers.get("X-User-ID")
                )
            except HTTPException as e:
                return JSONResponse({"detail": str(e.detail)}, status_code=e.status_code)

            try:
                tokens = await update_tokens(header_params, db=db)
            except HTTPException as e:
                return JSONResponse({"detail": str(e.detail)}, status_code=e.status_code)

        # db is closed here (we used it only to refresh tokens)
        response = await call_next(request)

        # determine whether request used headers or cookies
        using_headers = (
            header_params.access_token == request.headers.get("Authorization") or
            header_params.refresh_token == request.headers.get("X-Refresh-Token") or
            header_params.user_id == request.headers.get("X-User-ID")
        )

        if using_headers:
            response.headers["Authorization"] = tokens["access_token"]
            response.headers["X-Refresh-Token"] = tokens["refresh_token"]
            response.headers["X-User-ID"] = str(tokens["user_id"])
        else:
            # set cookies on the actual response object (won't attempt to JSON-serialize it)
            response = update_headers(response, tokens)

        return response
