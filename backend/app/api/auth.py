from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..current_user import get_current_user
from ..database import get_db
from ..models import User


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/me")
def sync_current_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }
