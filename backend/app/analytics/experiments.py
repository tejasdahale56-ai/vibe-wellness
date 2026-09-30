from statistics import mean

from sqlalchemy.orm import Session

from ..models import Experiment


MIN_EXPERIMENTS_FOR_PATTERN = 3


def get_completed_experiments(
    db: Session,
    user_id: int,
) -> list[Experiment]:
    """Collect only completed experiments owned by the requested user."""
    return (
        db.query(Experiment)
        .filter(
            Experiment.user_id == user_id,
            Experiment.status == "completed",
        )
        .order_by(Experiment.completed_at.asc(), Experiment.id.asc())
        .all()
    )


def summarize_experiment_energy(
    experiments: list[Experiment],
) -> dict:
    """Summarize measured energy changes without inferring causation."""
    changes = [
        experiment.energy_after - experiment.baseline_energy
        for experiment in experiments
        if experiment.energy_after is not None
        and experiment.baseline_energy is not None
    ]

    return {
        "completed_experiments": len(experiments),
        "analyzed_experiments": len(changes),
        "average_energy_change": (
            round(mean(changes), 2) if changes else None
        ),
        "positive_energy_changes": sum(change > 0 for change in changes),
        "negative_energy_changes": sum(change < 0 for change in changes),
        "enough_data_for_pattern": (
            len(changes) >= MIN_EXPERIMENTS_FOR_PATTERN
        ),
        "minimum_experiments_for_pattern": MIN_EXPERIMENTS_FOR_PATTERN,
    }
