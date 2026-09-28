from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..analytics.personal import build_insight as build_deterministic_insight
from ..database import get_db
from ..models import Biometric, Experiment, Meal
from ..schemas import InsightResponse


router = APIRouter(
    prefix="/api/insights",
    tags=["Insights"],
)


def _fetch_user_records(db: Session, user_id: int) -> list[dict]:
    records = []

    meals = (
        db.query(Meal)
        .filter(Meal.user_id == user_id)
        .order_by(Meal.logged_at.desc())
        .limit(20)
        .all()
    )
    for m in meals:
        records.append(
            {
                "type": "meal",
                "name": m.name,
                "meal_type": m.meal_type or "meal",
                "description": m.description,
                "date": m.logged_at.strftime("%Y-%m-%d"),
                "tags": m.tags or [],
            }
        )

    biometrics = (
        db.query(Biometric)
        .filter(Biometric.user_id == user_id)
        .order_by(Biometric.recorded_at.desc())
        .limit(10)
        .all()
    )
    for b in biometrics:
        records.append(
            {
                "type": "biometric",
                "date": b.recorded_at.strftime("%Y-%m-%d"),
                "sleep_hours": round(b.sleep_minutes / 60, 1),
                "steps": b.steps,
                "energy_score": b.energy_score,
                "active_minutes": b.active_minutes,
                "resting_heart_rate": b.resting_heart_rate_bpm,
            }
        )

    experiments = (
        db.query(Experiment)
        .filter(Experiment.user_id == user_id)
        .order_by(Experiment.id.desc())
        .limit(10)
        .all()
    )
    for e in experiments:
        records.append(
            {
                "type": "experiment",
                "name": e.title,
                "description": e.description,
                "status": e.status_label or e.status,
                "reflection": e.reflection,
            }
        )

    return records


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

    return build_deterministic_insight(
        biometrics=biometrics,
        meals=meals,
    )