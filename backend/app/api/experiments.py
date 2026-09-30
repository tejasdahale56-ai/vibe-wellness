from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..analytics.personal import calculate_baseline, get_biometric_history
from ..analytics.experiments import (
    get_completed_experiments,
    summarize_experiment_energy,
)
from ..current_user import get_current_user
from ..database import get_db
from ..models import Experiment, User
from ..schemas import (
    ExperimentCreate,
    ExperimentEnergySummary,
    ExperimentResponse,
)


router = APIRouter(
    prefix="/api/experiments",
    tags=["Experiments"],
)


@router.get(
    "",
    response_model=list[ExperimentResponse],
)
def get_experiments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Experiment)
        .filter(Experiment.user_id == current_user.id)
        .order_by(Experiment.id.desc())
        .all()
    )


@router.get(
    "/energy-summary",
    response_model=ExperimentEnergySummary,
)
def get_experiment_energy_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    experiments = get_completed_experiments(db, current_user.id)
    return summarize_experiment_energy(experiments)


@router.get(
    "/{experiment_id}",
    response_model=ExperimentResponse,
)
def get_experiment(
    experiment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id,
            Experiment.user_id == current_user.id,
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_experiment = Experiment(
        user_id=current_user.id,
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
    self_reported_energy: float = Query(ge=0, le=10),
    reflection: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    experiment = (
        db.query(Experiment)
        .filter(
            Experiment.id == experiment_id,
            Experiment.user_id == current_user.id,
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
    if experiment.baseline_energy is None:
        biometrics = get_biometric_history(db, current_user.id)
        if biometrics:
            experiment.baseline_energy = calculate_baseline(
                biometrics
            )["average_energy_score"]
    experiment.progress_percent = 100
    experiment.status = "completed"
    experiment.status_label = "Completed"
    experiment.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(experiment)

    return experiment
