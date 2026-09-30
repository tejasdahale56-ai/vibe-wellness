"""Development-only current-user dependency.

This is not authentication. Replace this dependency with real authentication
when the application gains an identity provider.
"""

from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User


def get_current_user(
    db: Session = Depends(get_db),
) -> User:
    """Return the configured development user for product requests."""

    user = db.get(User, settings.development_current_user_id)

    if user is None:
        raise HTTPException(
            status_code=503,
            detail="Development current user is not available.",
        )

    return user
