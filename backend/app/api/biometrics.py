from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..current_user import get_current_user
from ..models import Biometric, User
from ..schemas import BiometricCreate, BiometricResponse


router = APIRouter(
    prefix="/api/biometrics",
    tags=["Biometrics"],
)


@router.get(
    "",
    response_model=list[BiometricResponse],
)
def get_biometrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Biometric)
        .filter(Biometric.user_id == current_user.id)
        .order_by(Biometric.recorded_at.desc())
        .all()
    )


@router.post(
    "",
    response_model=BiometricResponse,
)
def create_biometric(
    biometric: BiometricCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_biometric = Biometric(
        user_id=current_user.id,
        **biometric.model_dump(),
    )

    db.add(new_biometric)
    db.commit()
    db.refresh(new_biometric)

    return new_biometric
