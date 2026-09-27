from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..analytics.personal import build_insight
from ..database import get_db
from ..schemas import InsightResponse


router = APIRouter(
    prefix="/api/insights",
    tags=["Insights"],
)


@router.get(
    "/today",
    response_model=InsightResponse,
)
def get_today_insight(
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    from ..analytics.personal import (
        get_biometric_history,
        get_meal_history,
    )

    biometrics = get_biometric_history(
        db=db,
        user_id=user_id,
    )

    meals = get_meal_history(
        db=db,
        user_id=user_id,
    )

    return build_insight(
        biometrics=biometrics,
        meals=meals,
    )