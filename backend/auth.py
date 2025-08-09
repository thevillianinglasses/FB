from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from models import User, UserRole

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", 480))  # 8 hours

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            return None
        return {"username": username, "role": role}
    except JWTError:
        return None

# Role-based access control
def check_permission(user_role: str, required_roles: list):
    """Check if user role has permission to access resource"""
    if UserRole.ADMIN in required_roles and user_role == UserRole.ADMIN:
        return True
    return user_role in required_roles

def has_admin_access(user_role: str):
    return user_role == UserRole.ADMIN

def has_reception_access(user_role: str):
    return user_role in [UserRole.ADMIN, UserRole.RECEPTION]

def has_lab_access(user_role: str):
    return user_role in [UserRole.ADMIN, UserRole.LABORATORY]

def has_pharmacy_access(user_role: str):
    return user_role in [UserRole.ADMIN, UserRole.PHARMACY]

def has_nursing_access(user_role: str):
    return user_role in [UserRole.ADMIN, UserRole.NURSING]

def has_doctor_access(user_role: str):
    return user_role in [UserRole.ADMIN, UserRole.DOCTOR]