from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..current_user import get_current_user
from ..models import Meal, User
from ..schemas import MealCreate, MealResponse


router = APIRouter(
    prefix="/api/meals",
    tags=["Meals"],
)


@router.get(
    "",
    response_model=list[MealResponse],
)
def get_meals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Meal)
        .filter(Meal.user_id == current_user.id)
        .order_by(Meal.logged_at.desc())
        .all()
    )


@router.post(
    "",
    response_model=MealResponse,
)
def create_meal(
    meal: MealCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_meal = Meal(
        user_id=current_user.id,
        **meal.model_dump(),
    )

    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)

    return new_meal
