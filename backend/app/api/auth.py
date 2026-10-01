"""Email/password authentication with server-stored opaque sessions."""

import hashlib
import secrets
from datetime import datetime, timedelta

import bcrypt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..config import settings
from ..current_user import get_current_user
from ..database import get_db
from ..models import User, UserSession
from ..schemas import AuthCredentials, SignupRequest, UserResponse


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_duration_hours * 60 * 60,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )


def _create_session(db: Session, user: User) -> str:
    token = secrets.token_urlsafe(32)
    db.add(
        UserSession(
            user_id=user.id,
            token_hash=hashlib.sha256(token.encode("utf-8")).hexdigest(),
            expires_at=datetime.utcnow() + timedelta(hours=settings.session_duration_hours),
        )
    )
    db.commit()
    return token


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter(func.lower(User.email) == payload.email)
        .first()
    )
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered.",
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered.",
        ) from None
    db.refresh(user)
    return user


@router.post("/login", response_model=UserResponse)
def login(
    payload: AuthCredentials,
    response: Response,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(func.lower(User.email) == payload.email)
        .first()
    )
    if (
        user is None
        or user.password_hash is None
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = _create_session(db, user)
    _set_session_cookie(response, token)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    session_token: str | None = Cookie(
        default=None,
        alias=settings.session_cookie_name,
    ),
    db: Session = Depends(get_db),
):
    if session_token:
        token_hash = hashlib.sha256(session_token.encode("utf-8")).hexdigest()
        db.query(UserSession).filter(UserSession.token_hash == token_hash).delete()
        db.commit()
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
        secure=settings.session_cookie_secure,
        httponly=True,
        samesite="lax",
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
