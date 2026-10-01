from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..current_user import get_current_user
from ..database import get_db
from ..models import Biometric, Experiment, Goal, Meal, Pattern, User
from ..schemas import HistoryEventResponse


router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("", response_model=list[HistoryEventResponse])
def get_health_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a newest-first timeline of persisted records for one user."""

    events: list[dict] = []

    biometrics = (
        db.query(Biometric)
        .filter(Biometric.user_id == current_user.id)
        .all()
    )
    for biometric in biometrics:
        events.append(
            {
                "type": "biometric",
                "timestamp": biometric.recorded_at,
                "title": "Wellness check-in",
                "description": "Recorded daily wellness signals.",
                "metadata": {
                    "sleep_minutes": biometric.sleep_minutes,
                    "steps": biometric.steps,
                    "energy_score": biometric.energy_score,
                },
            }
        )

    meals = db.query(Meal).filter(Meal.user_id == current_user.id).all()
    for meal in meals:
        events.append(
            {
                "type": "meal",
                "timestamp": meal.logged_at,
                "title": meal.name,
                "description": meal.description,
                "metadata": {
                    "meal_type": meal.meal_type,
                    "tags": meal.tags,
                },
            }
        )

    experiments = (
        db.query(Experiment)
        .filter(Experiment.user_id == current_user.id)
        .all()
    )
    for experiment in experiments:
        timestamp = experiment.completed_at or experiment.created_at
        if timestamp is None:
            continue
        events.append(
            {
                "type": "experiment",
                "timestamp": timestamp,
                "title": experiment.title,
                "description": experiment.description,
                "metadata": {
                    "status": experiment.status,
                    "duration_days": experiment.duration_days,
                    "progress_percent": experiment.progress_percent,
                },
            }
        )

    patterns = db.query(Pattern).filter(Pattern.user_id == current_user.id).all()
    for pattern in patterns:
        if pattern.created_at is None:
            continue
        events.append(
            {
                "type": "pattern",
                "timestamp": pattern.created_at,
                "title": pattern.title,
                "description": pattern.description,
                "metadata": {
                    "category": pattern.category,
                    "observation_count": pattern.observation_count,
                },
            }
        )

    goal = (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .first()
    )
    if goal is not None:
        events.append(
            {
                "type": "goal",
                "timestamp": goal.updated_at,
                "title": "Primary wellness goal",
                "description": goal.display_label,
                "metadata": {
                    "goal_type": goal.goal_type,
                    "created_at": goal.created_at.isoformat(),
                },
            }
        )

    return sorted(events, key=lambda event: event["timestamp"], reverse=True)
