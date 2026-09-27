from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Biometric
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
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    return (
        db.query(Biometric)
        .filter(Biometric.user_id == user_id)
        .order_by(Biometric.recorded_at.desc())
        .all()
    )


@router.post(
    "",
    response_model=BiometricResponse,
)
def create_biometric(
    biometric: BiometricCreate,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    new_biometric = Biometric(
        user_id=user_id,
        **biometric.model_dump(),
    )

    db.add(new_biometric)
    db.commit()
    db.refresh(new_biometric)

    return new_biometric