from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..current_user import get_current_user
from ..database import get_db
from ..models import Goal, User
from ..schemas import PrimaryGoalResponse, PrimaryGoalUpsert


router = APIRouter(
    prefix="/api/goals",
    tags=["Goals"],
)


@router.get(
    "/primary",
    response_model=PrimaryGoalResponse | None,
)
def get_primary_goal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .first()
    )


@router.put(
    "/primary",
    response_model=PrimaryGoalResponse,
)
def upsert_primary_goal(
    goal: PrimaryGoalUpsert,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_goal = (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .first()
    )
    if existing_goal is None:
        existing_goal = Goal(
            user_id=current_user.id,
            **goal.model_dump(),
        )
        db.add(existing_goal)
    else:
        for field, value in goal.model_dump().items():
            setattr(existing_goal, field, value)

    db.commit()
    db.refresh(existing_goal)
    return existing_goal
