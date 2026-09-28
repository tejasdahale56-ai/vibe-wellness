from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Pattern
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
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    return (
        db.query(Pattern)
        .filter(Pattern.user_id == user_id)
        .order_by(Pattern.id.asc())
        .all()
    )


@router.post(
    "",
    response_model=PatternResponse,
)
def create_pattern(
    pattern: PatternCreate,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    new_pattern = Pattern(
        user_id=user_id,
        **pattern.model_dump(),
    )

    db.add(new_pattern)
    db.commit()
    db.refresh(new_pattern)

    return new_pattern