# request_models.py
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str

class VerifyRequest(BaseModel):
    code: str
    user_id: int

class HeaderParams(BaseModel):
    access_token: str
    refresh_token: str
    user_id: int

class ResendRequest(BaseModel):
    id: int