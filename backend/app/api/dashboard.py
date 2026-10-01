from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..analytics.personal import calculate_baseline
from ..current_user import get_current_user
from ..database import get_db
from ..models import Biometric, PersonalMetricBaseline, User
from ..schemas import DashboardResponse


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "",
    response_model=DashboardResponse,
)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    biometrics = (
        db.query(Biometric)
        .filter(Biometric.user_id == current_user.id)
        .order_by(Biometric.recorded_at.desc())
        .all()
    )

    if not biometrics:
        raise HTTPException(
            status_code=404,
            detail="No biometric data found for this user.",
        )

    current = biometrics[0]

    personal_baseline = (
        db.query(PersonalMetricBaseline)
        .filter(PersonalMetricBaseline.user_id == current_user.id)
        .first()
    )

    baseline = calculate_baseline(
        list(reversed(biometrics))
    )

    metric_definitions = [
        ("sleep", "Sleep", "sleep_minutes", "average_sleep_minutes", "moon", "minutes", 1),
        ("steps", "Steps", "steps", "average_steps", "footprints", "count", 0),
        ("resting-heart-rate", "Resting HR", "resting_heart_rate_bpm", "average_resting_heart_rate_bpm", "heart", "bpm", 0),
        ("hrv", "HRV", "hrv_milliseconds", "average_hrv_milliseconds", "activity", "ms", 0),
        ("energy", "Energy", "energy_score", "average_energy_score", "bolt", "score", 1),
        ("active-minutes", "Active minutes", "active_minutes", "average_active_minutes", "activity", "minutes", 0),
    ]
    metrics = []
    for metric_id, label, field, average_field, icon, unit, precision in metric_definitions:
        reference = (
            getattr(personal_baseline, field)
            if personal_baseline is not None
            else baseline[average_field]
        )
        value = getattr(current, field)
        difference = round(value - reference, precision) if value is not None and reference is not None else None
        if value is None:
            formatted_value = "—"
        elif unit == "minutes":
            formatted_value = f"{round(value / 60, 1)}h" if field == "sleep_minutes" else f"{int(value)} min"
        elif unit == "count":
            formatted_value = f"{int(value):,}"
        elif unit == "bpm":
            formatted_value = f"{int(value)} bpm"
        elif unit == "ms":
            formatted_value = f"{int(value)} ms"
        else:
            formatted_value = f"{value:.1f}/10"

        if difference is None:
            description = "Not recorded today" if value is None else "Set a personal baseline to compare"
            tone = "neutral"
        else:
            formatted_difference = f"{difference:+.{precision}f}" if precision else f"{difference:+,.0f}"
            suffix = {"minutes": " min", "bpm": " bpm", "ms": " ms", "score": " points"}.get(unit, "")
            description = f"{formatted_difference}{suffix} vs your baseline"
            favorable = difference <= 0 if field == "resting_heart_rate_bpm" else difference >= 0
            tone = "green" if favorable else "amber"

        metrics.append({
            "id": metric_id,
            "label": label,
            "value": formatted_value,
            "description": description,
            "icon": icon,
            "tone": tone,
        })

    return {
        "biometrics": current,
        "metrics": metrics,
    }
