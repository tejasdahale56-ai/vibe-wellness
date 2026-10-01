from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..analytics.personal import calculate_baseline
from ..current_user import get_current_user
from ..database import get_db
from ..models import Biometric, User
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

    baseline = calculate_baseline(
        list(reversed(biometrics))
    )

    def change(value, average):
        return round(value - average, 1) if value is not None and average is not None else None

    sleep_change = change(current.sleep_minutes, baseline["average_sleep_minutes"])
    steps_change = change(current.steps, baseline["average_steps"])
    energy_change = change(current.energy_score, baseline["average_energy_score"])
    active_change = change(current.active_minutes, baseline["average_active_minutes"])

    metrics = [
        {
            "id": "sleep",
            "label": "Sleep",
            "value": f"{round(current.sleep_minutes / 60, 1)}h" if current.sleep_minutes is not None else "—",
            "description": (
                f"{'+' if sleep_change is not None and sleep_change >= 0 else ''}"
                f"{sleep_change} min vs your baseline" if sleep_change is not None else "Baseline unavailable"
            ),
            "icon": "moon",
            "tone": (
                "green"
                if sleep_change is not None and sleep_change >= 0
                else "amber"
            ),
        },
        {
            "id": "steps",
            "label": "Steps",
            "value": f"{current.steps:,}" if current.steps is not None else "—",
            "description": (
                f"{'+' if steps_change is not None and steps_change >= 0 else ''}"
                f"{int(steps_change):,} vs your baseline" if steps_change is not None else "Baseline unavailable"
            ),
            "icon": "footprints",
            "tone": (
                "green"
                if steps_change is not None and steps_change >= 0
                else "amber"
            ),
        },
        {
            "id": "energy",
            "label": "Energy",
            "value": f"{current.energy_score:.1f}/10" if current.energy_score is not None else "—",
            "description": (
                f"{'+' if energy_change is not None and energy_change >= 0 else ''}"
                f"{energy_change:.1f} vs your baseline" if energy_change is not None else "Not provided in this data"
            ),
            "icon": "bolt",
            "tone": (
                "green"
                if energy_change is not None and energy_change >= 0
                else "amber"
            ),
        },
        {
            "id": "active",
            "label": "Active",
            "value": f"{current.active_minutes} min" if current.active_minutes is not None else "—",
            "description": (
                f"{'+' if active_change is not None and active_change >= 0 else ''}"
                f"{active_change:.0f} min vs your baseline" if active_change is not None else "Baseline unavailable"
            ),
            "icon": "activity",
            "tone": (
                "green"
                if active_change is not None and active_change >= 0
                else "amber"
            ),
        },
    ]

    return {
        "biometrics": current,
        "metrics": metrics,
    }
