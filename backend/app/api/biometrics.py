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


@router.put("/{biometric_id}", response_model=BiometricResponse)
def update_biometric(
    biometric_id: int,
    biometric: BiometricCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    record = (
        db.query(Biometric)
        .filter(
            Biometric.id == biometric_id,
            Biometric.user_id == current_user.id,
        )
        .first()
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Biometric check-in not found.")

    for field, value in biometric.model_dump().items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record
