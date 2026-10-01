from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..current_user import get_current_user
from ..meal_nutrition import estimate_meal_nutrition
from ..meal_tagging import infer_meal_type, merge_meal_tags
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
    meal_data = meal.model_dump()
    if not meal_data["meal_type"]:
        meal_data["meal_type"] = infer_meal_type(meal_data["logged_at"])
    meal_data["tags"] = merge_meal_tags(
        meal_data["tags"],
        meal_data["name"],
        meal_data["description"],
    )
    meal_data.update(
        estimate_meal_nutrition(
            meal_data["name"],
            meal_data["description"],
            portion_size=meal_data["portion_size"],
        )
    )
    new_meal = Meal(
        user_id=current_user.id,
        **meal_data,
    )

    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)

    return new_meal
