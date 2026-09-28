from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Meal
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
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    return (
        db.query(Meal)
        .filter(Meal.user_id == user_id)
        .order_by(Meal.logged_at.desc())
        .all()
    )


@router.post(
    "",
    response_model=MealResponse,
)
def create_meal(
    meal: MealCreate,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    new_meal = Meal(
        user_id=user_id,
        **meal.model_dump(),
    )

    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)

    return new_meal