from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..current_user import get_current_user
from ..models import Pattern, User
from ..schemas import PatternCreate, PatternResponse


router = APIRouter(
    prefix="/api/patterns",
    tags=["Patterns"],
)


@router.get(
    "",
    response_model=list[PatternResponse],
)
def get_patterns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Pattern)
        .filter(Pattern.user_id == current_user.id)
        .order_by(Pattern.id.asc())
        .all()
    )


@router.post(
    "",
    response_model=PatternResponse,
)
def create_pattern(
    pattern: PatternCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_pattern = Pattern(
        user_id=current_user.id,
        **pattern.model_dump(),
    )

    db.add(new_pattern)
    db.commit()
    db.refresh(new_pattern)

    return new_pattern
