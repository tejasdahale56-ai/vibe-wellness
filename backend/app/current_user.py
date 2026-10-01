"""Authenticated-user dependency shared by protected API routes."""

import hashlib
from datetime import datetime

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from .config import settings
from .models import User, UserSession


def get_current_user(
    session_token: str | None = Cookie(
        default=None,
        alias=settings.session_cookie_name,
    ),
    db: Session = Depends(get_db),
) -> User:
    """Return the user identified by the HTTP-only opaque session cookie."""

    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    token_hash = hashlib.sha256(session_token.encode("utf-8")).hexdigest()
    session = (
        db.query(UserSession)
        .filter(
            UserSession.token_hash == token_hash,
            UserSession.expires_at > datetime.utcnow(),
        )
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )

    return session.user
