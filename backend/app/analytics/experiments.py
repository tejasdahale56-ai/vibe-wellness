from datetime import timedelta
from statistics import mean

from sqlalchemy.orm import Session

from ..models import Biometric, Experiment
from .personal import average


MIN_EXPERIMENTS_FOR_PATTERN = 3
MIN_BASELINE_OBSERVATIONS = 2
MIN_EXPERIMENT_PERIOD_OBSERVATIONS = 1

ADDITIONAL_MEASUREMENT_FIELDS = (
    "sleep_minutes",
    "steps",
    "resting_heart_rate_bpm",
    "hrv_milliseconds",
    "active_minutes",
)


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


def calculate_experiment_measurement(
    experiment: Experiment,
    biometrics: list[Biometric],
) -> dict:
    """Compare adjacent baseline and experiment-period measurements.

    The experiment period is inferred from the configured duration because the
    existing model does not persist a separate start timestamp. This produces a
    transparent before-versus-during comparison without inferring causation.
    """

    if experiment.completed_at is None:
        return {
            "baseline_energy": None,
            "experiment_period_energy": None,
            "observed_energy_difference": None,
            "baseline_observation_count": 0,
            "experiment_period_observation_count": 0,
            "usable_observation_count": 0,
            "sufficient_data": False,
            "experiment_period_source": "unavailable",
            "additional_measurements": {},
            "summary": (
                "This experiment has no completion time, so a before-versus-"
                "during comparison cannot be calculated."
            ),
        }

    experiment_window_start = experiment.completed_at - timedelta(
        days=experiment.duration_days
    )
    baseline_window_start = experiment_window_start - timedelta(
        days=experiment.duration_days
    )
    baseline_records = [
        record
        for record in biometrics
        if baseline_window_start <= record.recorded_at < experiment_window_start
    ]
    experiment_records = [
        record
        for record in biometrics
        if experiment_window_start <= record.recorded_at <= experiment.completed_at
    ]

    baseline_energy = (
        average([record.energy_score for record in baseline_records])
        if baseline_records
        else None
    )
    biometric_experiment_energy = (
        average([record.energy_score for record in experiment_records])
        if experiment_records
        else None
    )
    completion_energy = (
        experiment.self_reported_energy
        if experiment.self_reported_energy is not None
        else experiment.energy_after
    )
    if biometric_experiment_energy is not None:
        experiment_period_energy = biometric_experiment_energy
        experiment_period_observation_count = len(experiment_records)
        experiment_period_source = "biometric_history"
    elif completion_energy is not None:
        experiment_period_energy = completion_energy
        experiment_period_observation_count = 1
        experiment_period_source = "completion_check_in"
    else:
        experiment_period_energy = None
        experiment_period_observation_count = 0
        experiment_period_source = "unavailable"

    sufficient_data = (
        len(baseline_records) >= MIN_BASELINE_OBSERVATIONS
        and experiment_period_observation_count
        >= MIN_EXPERIMENT_PERIOD_OBSERVATIONS
    )
    observed_energy_difference = (
        round(experiment_period_energy - baseline_energy, 2)
        if sufficient_data
        and baseline_energy is not None
        and experiment_period_energy is not None
        else None
    )
    additional_measurements = {}
    if sufficient_data and baseline_records and experiment_records:
        for field in ADDITIONAL_MEASUREMENT_FIELDS:
            baseline_value = average(
                [float(getattr(record, field)) for record in baseline_records]
            )
            experiment_period_value = average(
                [float(getattr(record, field)) for record in experiment_records]
            )
            additional_measurements[field] = {
                "baseline": baseline_value,
                "experiment_period": experiment_period_value,
                "observed_difference": round(
                    experiment_period_value - baseline_value,
                    2,
                ),
            }

    if sufficient_data:
        summary = (
            f"Across {len(baseline_records)} baseline biometric observations "
            f"and {experiment_period_observation_count} during-experiment "
            f"measurement(s), energy averaged {baseline_energy:.2f} / 10 "
            f"before and {experiment_period_energy:.2f} / 10 during the "
            f"experiment. The observed difference was "
            f"{observed_energy_difference:+.2f}. This is an observation, not "
            "evidence that the experiment caused the difference."
        )
    else:
        summary = (
            "There are not enough measurements to compare the baseline and "
            "experiment period. This result does not infer an effect."
        )

    return {
        "baseline_energy": baseline_energy,
        "experiment_period_energy": experiment_period_energy,
        "observed_energy_difference": observed_energy_difference,
        "baseline_observation_count": len(baseline_records),
        "experiment_period_observation_count": experiment_period_observation_count,
        "usable_observation_count": (
            len(baseline_records) + experiment_period_observation_count
        ),
        "sufficient_data": sufficient_data,
        "experiment_period_source": experiment_period_source,
        "additional_measurements": additional_measurements,
        "summary": summary,
    }
