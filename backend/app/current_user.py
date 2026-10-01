"""Firebase bearer-token verification and per-user database synchronization."""

import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User


bearer_scheme = HTTPBearer(auto_error=False)


def _firebase_app():
    if not settings.firebase_project_id:
        raise HTTPException(
            status_code=503,
            detail="Firebase authentication is not configured on the server.",
        )

    try:
        app = firebase_admin.get_app()
    except ValueError:
        try:
            app = firebase_admin.initialize_app(
                (
                    credentials.Certificate(settings.firebase_credentials_path)
                    if settings.firebase_credentials_path
                    else credentials.ApplicationDefault()
                ),
                {"projectId": settings.firebase_project_id},
            )
        except Exception:
            raise HTTPException(
                status_code=503,
                detail="Firebase authentication is not available on the server.",
            ) from None

    if app.project_id != settings.firebase_project_id:
        raise HTTPException(
            status_code=503,
            detail="Firebase authentication is not configured on the server.",
        )
    return app


def get_current_user(
    credentials_header: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials_header is None or credentials_header.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    app = _firebase_app()
    try:
        claims = auth.verify_id_token(credentials_header.credentials, app=app)
    except (auth.InvalidIdTokenError, auth.ExpiredIdTokenError, auth.RevokedIdTokenError, auth.UserDisabledError):
        raise HTTPException(
            status_code=401,
            detail="Your session is invalid or has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Authentication could not be verified. Please try again.",
        ) from None

    uid = claims.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Authentication required.")

    user = db.query(User).filter(User.firebase_uid == uid).first()
    email = claims.get("email")
    name = claims.get("name") or (email.split("@", 1)[0] if email else "VIBE member")

    if user is None:
        user = User(firebase_uid=uid, email=email, name=name)
        db.add(user)
    else:
        user.email = email
        user.name = name

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="This account needs support before it can be linked to wellness data.",
        ) from None

    return user
