from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..analytics.experiments import (
    get_completed_experiments,
    summarize_experiment_energy,
)
from ..analytics.discovery import discover_personal_patterns
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
from ..schemas import (
    PersonalBaselineResponse,
    PersonalPatternDiscoveryResponse,
)


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)

MIN_BIOMETRIC_OBSERVATIONS_FOR_INSIGHT = 3

BASELINE_METRIC_FIELDS = {
    "sleep_minutes": "average_sleep_minutes",
    "steps": "average_steps",
    "resting_heart_rate_bpm": "average_resting_heart_rate_bpm",
    "hrv_milliseconds": "average_hrv_milliseconds",
    "active_minutes": "average_active_minutes",
    "energy_score": "average_energy_score",
}


@router.get("/baseline", response_model=PersonalBaselineResponse)
def get_personal_baseline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return deterministic latest-versus-average biometric comparisons."""

    biometrics = get_biometric_history(
        db=db,
        user_id=current_user.id,
    )
    baseline = calculate_baseline(biometrics)
    deviation = calculate_current_deviation(biometrics)
    latest = biometrics[-1] if biometrics else None

    return {
        "observation_count": len(biometrics),
        "latest_recorded_at": latest.recorded_at if latest else None,
        "metrics": {
            field: {
                "baseline": baseline[baseline_field],
                "latest": getattr(latest, field) if latest else None,
                "difference": deviation.get(field),
            }
            for field, baseline_field in BASELINE_METRIC_FIELDS.items()
        },
    }


@router.get("/patterns", response_model=PersonalPatternDiscoveryResponse)
def get_discovered_patterns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return computed, non-persistent associations for the current user."""

    biometrics = get_biometric_history(
        db=db,
        user_id=current_user.id,
    )
    meals = get_meal_history(
        db=db,
        user_id=current_user.id,
    )
    return discover_personal_patterns(biometrics, meals)


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

    experiments = get_completed_experiments(
        db=db,
        user_id=current_user.id,
    )
    experiment_summary = summarize_experiment_energy(experiments)

    baseline = calculate_baseline(biometrics)

    deviation = calculate_current_deviation(
        biometrics
    )

    sleep_comparison = compare_sleep_and_energy(
        biometrics
    )

    # Avoid presenting a one- or two-record comparison as a personal pattern.
    insight = build_insight(
        biometrics=(
            biometrics
            if len(biometrics) >= MIN_BIOMETRIC_OBSERVATIONS_FOR_INSIGHT
            else []
        ),
        meals=meals,
    )

    if experiment_summary["enough_data_for_pattern"]:
        latest_measured = next(
            experiment
            for experiment in reversed(experiments)
            if experiment.energy_after is not None
            and experiment.baseline_energy is not None
        )
        average_change = experiment_summary["average_energy_change"]
        insight.update(
            {
                "id": f"experiment-{latest_measured.id}",
                "date_label": (
                    latest_measured.completed_at.strftime("%b %d")
                    if latest_measured.completed_at
                    else None
                ),
                "heading": "Completed experiment summary",
                "score": None,
                "title": "Energy changes across your completed experiments.",
                "summary": (
                    f"Across {experiment_summary['analyzed_experiments']} "
                    f"completed experiments with both energy measurements, "
                    f"the average change was {average_change:+.2f} points. "
                    f"{experiment_summary['positive_energy_changes']} had a "
                    f"positive change and "
                    f"{experiment_summary['negative_energy_changes']} had a "
                    "negative change."
                ),
                "context": (
                    "These are observations in your own records; they do not "
                    "establish that an experiment caused an energy change."
                ),
                "method_note": (
                    "Energy change is calculated as energy_after minus "
                    "baseline_energy for this user's completed experiments "
                    "with both values recorded."
                ),
                "category": "experiment",
            }
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
