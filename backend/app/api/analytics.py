from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..analytics.personal import (
    build_insight,
    calculate_baseline,
    calculate_current_deviation,
    compare_sleep_and_energy,
    get_biometric_history,
    get_meal_history,
)
from ..current_user import get_current_user
from ..database import get_db
from ..models import User


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)


@router.get("/summary")
def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    biometrics = get_biometric_history(
        db=db,
        user_id=current_user.id,
    )

    meals = get_meal_history(
        db=db,
        user_id=current_user.id,
    )

    baseline = calculate_baseline(biometrics)

    deviation = calculate_current_deviation(
        biometrics
    )

    sleep_comparison = compare_sleep_and_energy(
        biometrics
    )

    insight = build_insight(
        biometrics=biometrics,
        meals=meals,
    )

    latest_meal = None

    if meals:
        latest = meals[-1]

        latest_meal = {
            "id": latest.id,
            "name": latest.name,
            "meal_type": latest.meal_type,
            "description": latest.description,
            "logged_at": latest.logged_at,
            "time_label": latest.time_label,
            "tags": latest.tags,
        }

    return {
        "user_id": current_user.id,
        "observations": {
            "biometric_days": len(biometrics),
            "meals_logged": len(meals),
        },
        "baseline": baseline,
        "current_deviation": deviation,
        "sleep_energy_comparison": sleep_comparison,
        "latest_meal": latest_meal,
        "insight": insight,
    }
