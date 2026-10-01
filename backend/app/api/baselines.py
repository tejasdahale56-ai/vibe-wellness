from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..current_user import get_current_user
from ..database import get_db
from ..models import PersonalMetricBaseline, User
from ..schemas import PersonalMetricBaselineInput, PersonalMetricBaselineResponse


router = APIRouter(prefix="/api/baseline", tags=["Personal baseline"])


@router.get("", response_model=PersonalMetricBaselineResponse | None)
def get_personal_metric_baseline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(PersonalMetricBaseline)
        .filter(PersonalMetricBaseline.user_id == current_user.id)
        .first()
    )


@router.put("", response_model=PersonalMetricBaselineResponse)
def save_personal_metric_baseline(
    payload: PersonalMetricBaselineInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    baseline = (
        db.query(PersonalMetricBaseline)
        .filter(PersonalMetricBaseline.user_id == current_user.id)
        .first()
    )
    if baseline is None:
        baseline = PersonalMetricBaseline(user_id=current_user.id, **payload.model_dump())
        db.add(baseline)
    else:
        for field, value in payload.model_dump().items():
            setattr(baseline, field, value)

    db.commit()
    db.refresh(baseline)
    return baseline
