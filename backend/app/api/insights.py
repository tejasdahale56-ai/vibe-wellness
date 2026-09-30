from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..analytics.experiments import (
    MIN_EXPERIMENTS_FOR_PATTERN,
    get_completed_experiments,
    summarize_experiment_energy,
)
from ..analytics.personal import (
    build_insight as build_deterministic_insight,
    get_biometric_history,
)
from ..current_user import get_current_user
from ..database import get_db
from ..models import User
from ..schemas import InsightResponse


router = APIRouter(
    prefix="/api/insights",
    tags=["Insights"],
)

MIN_BIOMETRIC_OBSERVATIONS_FOR_INSIGHT = 3


@router.get(
    "/today",
    response_model=InsightResponse,
)
def get_today_insight(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    biometrics = get_biometric_history(
        db=db,
        user_id=current_user.id,
    )

    experiments = get_completed_experiments(db, current_user.id)
    experiment_summary = summarize_experiment_energy(experiments)

    if experiment_summary["enough_data_for_pattern"]:
        latest_experiment = experiments[-1]
        average_change = experiment_summary["average_energy_change"]
        return {
            "id": f"experiment-{latest_experiment.id}",
            "date_label": (
                latest_experiment.completed_at.strftime("%b %d")
                if latest_experiment.completed_at
                else None
            ),
            "heading": "Completed experiment summary",
            "score": None,
            "title": "Your completed experiments show these energy changes.",
            "summary": (
                f"Across {experiment_summary['analyzed_experiments']} "
                f"completed experiments with recorded baseline and follow-up "
                f"energy, the average change was {average_change:+.2f} points. "
                f"{experiment_summary['positive_energy_changes']} showed an "
                f"increase and {experiment_summary['negative_energy_changes']} "
                "showed a decrease."
            ),
            "context": (
                "These are personal observations from completed experiments; "
                "they do not establish that an experiment caused an energy change."
            ),
            "method_note": (
                "Energy change is calculated as energy after the experiment "
                "minus baseline energy. Only this user's completed experiments "
                "with both measurements are included."
            ),
            "comparison": {
                "comparable_days": 0,
                "average_afternoon_energy": 0.0,
                "average_experiment_energy_change": average_change,
            },
            "category": "experiment",
        }

    if len(biometrics) >= MIN_BIOMETRIC_OBSERVATIONS_FOR_INSIGHT:
        return build_deterministic_insight(biometrics=biometrics)

    return {
        "id": "insight-insufficient-data",
        "date_label": None,
        "heading": "Not enough data yet.",
        "score": None,
        "title": "Not enough data yet.",
        "summary": (
            "There are not enough recorded observations to identify a "
            "personal pattern yet. More biometric observations or completed "
            "experiments with both baseline and follow-up energy are needed."
        ),
        "context": None,
        "method_note": (
            "This insight uses only persisted records belonging to your account."
        ),
        "comparison": {
            "comparable_days": 0,
            "average_afternoon_energy": 0.0,
            "average_experiment_energy_change": None,
        },
        "category": "general",
    }
