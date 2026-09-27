from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Experiment
from ..schemas import ExperimentCreate, ExperimentResponse


router = APIRouter(
    prefix="/api/experiments",
    tags=["Experiments"],
)


@router.get(
    "",
    response_model=list[ExperimentResponse],
)
def get_experiments(
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    return (
        db.query(Experiment)
        .filter(Experiment.user_id == user_id)
        .order_by(Experiment.id.desc())
        .all()
    )


@router.get(
    "/{experiment_id}",
    response_model=ExperimentResponse,
)
def get_experiment(
    experiment_id: int,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id,
            Experiment.user_id == user_id,
        )
        .first()
    )

    if experiment is None:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found",
        )

    return experiment


@router.post(
    "",
    response_model=ExperimentResponse,
)
def create_experiment(
    experiment: ExperimentCreate,
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    new_experiment = Experiment(
        user_id=user_id,
        **experiment.model_dump(),
    )

    db.add(new_experiment)
    db.commit()
    db.refresh(new_experiment)

    return new_experiment


@router.patch(
    "/{experiment_id}/complete",
    response_model=ExperimentResponse,
)
def complete_experiment(
    experiment_id: int,
    self_reported_energy: float,
    reflection: str = "",
    user_id: int = 1,
    db: Session = Depends(get_db),
):
    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id,
            Experiment.user_id == user_id,
        )
        .first()
    )

    if experiment is None:
        raise HTTPException(
            status_code=404,
            detail="Experiment not found",
        )

    experiment.self_reported_energy = self_reported_energy
    experiment.reflection = reflection
    experiment.energy_after = self_reported_energy
    experiment.progress_percent = 100
    experiment.status = "completed"
    experiment.status_label = "Completed"
    experiment.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(experiment)

    return experiment