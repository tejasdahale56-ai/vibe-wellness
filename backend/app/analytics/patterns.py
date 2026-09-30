from collections import Counter
from datetime import timedelta

from sqlalchemy.orm import Session

from ..models import Experiment, Meal


MIN_POSITIVE_EXPERIMENTS_FOR_PATTERN = 3
MIN_REPEATED_EXPERIMENTS_FOR_PATTERN = 2


def analyze_meal_experiment_patterns(
    db: Session,
    user_id: int,
) -> dict:
    """Find meals repeatedly logged during positive experiments' windows.

    Each experiment's meal window spans ``duration_days`` before its
    completion timestamp. Results describe co-occurrence only and are never
    saved as Pattern records.
    """
    experiments = (
        db.query(Experiment)
        .filter(
            Experiment.user_id == user_id,
            Experiment.status == "completed",
        )
        .order_by(Experiment.completed_at.asc(), Experiment.id.asc())
        .all()
    )

    measured = [
        experiment
        for experiment in experiments
        if experiment.baseline_energy is not None
        and experiment.energy_after is not None
    ]
    positive = [
        experiment
        for experiment in measured
        if experiment.energy_after > experiment.baseline_energy
    ]
    dated_positive = [
        experiment
        for experiment in positive
        if experiment.completed_at is not None
    ]

    enough_data = (
        len(dated_positive) >= MIN_POSITIVE_EXPERIMENTS_FOR_PATTERN
    )
    observations = []

    if enough_data:
        earliest_window = min(
            experiment.completed_at - timedelta(
                days=experiment.duration_days
            )
            for experiment in dated_positive
        )
        latest_completion = max(
            experiment.completed_at for experiment in dated_positive
        )
        meals = (
            db.query(Meal)
            .filter(
                Meal.user_id == user_id,
                Meal.logged_at >= earliest_window,
                Meal.logged_at <= latest_completion,
            )
            .order_by(Meal.logged_at.asc(), Meal.id.asc())
            .all()
        )

        counts: dict[tuple[str, str], int] = Counter()
        for experiment in dated_positive:
            start = experiment.completed_at - timedelta(
                days=experiment.duration_days
            )
            experiment_meals = [
                meal
                for meal in meals
                if start <= meal.logged_at <= experiment.completed_at
            ]
            features = set()
            for meal in experiment_meals:
                name = meal.name.strip().casefold()
                if name:
                    features.add(("meal", name))
                meal_type = (meal.meal_type or "").strip().casefold()
                if meal_type:
                    features.add(("meal_type", meal_type))
            counts.update(features)

        for (feature_type, feature_value), occurrence_count in sorted(
            counts.items()
        ):
            if occurrence_count < MIN_REPEATED_EXPERIMENTS_FOR_PATTERN:
                continue
            observations.append(
                {
                    "kind": "meal_before_positive_energy_change",
                    "feature_type": feature_type,
                    "feature_value": feature_value,
                    "positive_experiments_with_feature": occurrence_count,
                    "positive_experiments_analyzed": len(dated_positive),
                    "repetition_rate": round(
                        occurrence_count / len(dated_positive), 2
                    ),
                    "window_rule": "duration_days_before_completion",
                    "causal_claim": False,
                }
            )

    return {
        "completed_experiments": len(experiments),
        "measurable_completed_experiments": len(measured),
        "positive_energy_experiments": len(positive),
        "positive_experiments_analyzed": len(dated_positive),
        "enough_data_for_pattern": enough_data,
        "minimum_positive_experiments": MIN_POSITIVE_EXPERIMENTS_FOR_PATTERN,
        "observations": observations,
    }
