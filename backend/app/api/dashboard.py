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

    sleep_change = round(
        current.sleep_minutes
        - baseline["average_sleep_minutes"],
        1,
    )

    steps_change = round(
        current.steps
        - baseline["average_steps"],
        1,
    )

    energy_change = round(
        current.energy_score
        - baseline["average_energy_score"],
        1,
    )

    active_change = round(
        current.active_minutes
        - baseline["average_active_minutes"],
        1,
    )

    metrics = [
        {
            "id": "sleep",
            "label": "Sleep",
            "value": f"{round(current.sleep_minutes / 60, 1)}h",
            "description": (
                f"{'+' if sleep_change >= 0 else ''}"
                f"{sleep_change} min vs your baseline"
            ),
            "icon": "moon",
            "tone": (
                "green"
                if sleep_change >= 0
                else "amber"
            ),
        },
        {
            "id": "steps",
            "label": "Steps",
            "value": f"{current.steps:,}",
            "description": (
                f"{'+' if steps_change >= 0 else ''}"
                f"{int(steps_change):,} vs your baseline"
            ),
            "icon": "footprints",
            "tone": (
                "green"
                if steps_change >= 0
                else "amber"
            ),
        },
        {
            "id": "energy",
            "label": "Energy",
            "value": f"{current.energy_score:.1f}/10",
            "description": (
                f"{'+' if energy_change >= 0 else ''}"
                f"{energy_change:.1f} vs your baseline"
            ),
            "icon": "bolt",
            "tone": (
                "green"
                if energy_change >= 0
                else "amber"
            ),
        },
        {
            "id": "active",
            "label": "Active",
            "value": f"{current.active_minutes} min",
            "description": (
                f"{'+' if active_change >= 0 else ''}"
                f"{active_change:.0f} min vs your baseline"
            ),
            "icon": "activity",
            "tone": (
                "green"
                if active_change >= 0
                else "amber"
            ),
        },
    ]

    return {
        "biometrics": current,
        "metrics": metrics,
    }
