from datetime import date, timedelta
from statistics import mean

from ..models import Biometric, Meal
from .personal import average


MIN_PATTERN_OBSERVATIONS = 6
MIN_GROUP_OBSERVATIONS = 3
MIN_ENERGY_DIFFERENCE = 0.5


BIOMETRIC_PATTERN_FIELDS = (
    ("sleep_minutes", "sleep", "sleep"),
    ("steps", "steps", "movement"),
    ("hrv_milliseconds", "HRV", "recovery"),
    (
        "resting_heart_rate_bpm",
        "resting heart rate",
        "recovery",
    ),
)


def _compare_energy_groups(
    values_and_energy: list[tuple[float, float]],
) -> dict | None:
    """Compare energy above and below a user's own average value."""

    if len(values_and_energy) < MIN_PATTERN_OBSERVATIONS:
        return None

    average_value = mean(value for value, _ in values_and_energy)
    lower_energy = [
        energy
        for value, energy in values_and_energy
        if value < average_value
    ]
    higher_energy = [
        energy
        for value, energy in values_and_energy
        if value >= average_value
    ]

    if min(len(lower_energy), len(higher_energy)) < MIN_GROUP_OBSERVATIONS:
        return None

    lower_average = average(lower_energy)
    higher_average = average(higher_energy)
    difference = round(higher_average - lower_average, 2)

    if abs(difference) < MIN_ENERGY_DIFFERENCE:
        return None

    return {
        "observation_count": len(values_and_energy),
        "lower_count": len(lower_energy),
        "higher_count": len(higher_energy),
        "lower_average_energy": lower_average,
        "higher_average_energy": higher_average,
        "difference": difference,
    }


def _discover_biometric_patterns(
    biometrics: list[Biometric],
) -> list[dict]:
    patterns = []

    for field, label, category in BIOMETRIC_PATTERN_FIELDS:
        comparison = _compare_energy_groups(
            [
                (float(getattr(record, field)), float(record.energy_score))
                for record in biometrics
                if getattr(record, field) is not None and record.energy_score is not None
            ]
        )
        if comparison is None:
            continue

        energy_direction = (
            "higher"
            if comparison["difference"] > 0
            else "lower"
        )
        patterns.append(
            {
                "title": (
                    f"Higher {label} was associated with "
                    f"{energy_direction} energy."
                ),
                "description": (
                    f"Across {comparison['observation_count']} recorded days, "
                    f"reported energy averaged "
                    f"{comparison['higher_average_energy']:.1f} / 10 on days "
                    f"at or above your typical {label}, compared with "
                    f"{comparison['lower_average_energy']:.1f} / 10 on days "
                    "below it."
                ),
                "category": category,
                "observation_count": comparison["observation_count"],
                "supporting_detail": (
                    f"Compared {comparison['higher_count']} at-or-above-typical "
                    f"days with {comparison['lower_count']} below-typical days. "
                    "This is an observational association, not evidence of "
                    "causation."
                ),
            }
        )

    return patterns


def _latest_biometrics_by_day(
    biometrics: list[Biometric],
) -> dict[date, Biometric]:
    latest_by_day = {}
    for record in biometrics:
        recorded_day = record.recorded_at.date()
        if (
            recorded_day not in latest_by_day
            or record.recorded_at > latest_by_day[recorded_day].recorded_at
        ):
            latest_by_day[recorded_day] = record
    return latest_by_day


def _latest_meal_minutes_by_day(
    meals: list[Meal],
) -> dict[date, int]:
    latest_minutes_by_day = {}
    for meal in meals:
        meal_minutes = meal.logged_at.hour * 60 + meal.logged_at.minute
        meal_day = meal.logged_at.date()
        if meal_minutes > latest_minutes_by_day.get(meal_day, -1):
            latest_minutes_by_day[meal_day] = meal_minutes
    return latest_minutes_by_day


def _discover_meal_timing_pattern(
    biometrics: list[Biometric],
    meals: list[Meal],
) -> tuple[dict | None, int]:
    """Compare last logged meal time with an exact next-day energy record."""

    biometrics_by_day = _latest_biometrics_by_day(biometrics)
    meal_minutes_by_day = _latest_meal_minutes_by_day(meals)
    pairs = [
        (meal_minutes, float(biometrics_by_day[meal_day + timedelta(days=1)].energy_score))
        for meal_day, meal_minutes in meal_minutes_by_day.items()
        if meal_day + timedelta(days=1) in biometrics_by_day
        and biometrics_by_day[meal_day + timedelta(days=1)].energy_score is not None
    ]
    comparison = _compare_energy_groups(pairs)

    if comparison is None:
        return None, len(pairs)

    energy_direction = (
        "higher"
        if comparison["difference"] > 0
        else "lower"
    )
    return {
        "title": (
            "Later logged meals were associated with "
            f"{energy_direction} next-day energy."
        ),
        "description": (
            f"Across {comparison['observation_count']} meal-to-next-day "
            f"matches, next-day reported energy averaged "
            f"{comparison['higher_average_energy']:.1f} / 10 after later "
            f"logged meals, compared with "
            f"{comparison['lower_average_energy']:.1f} / 10 after earlier "
            "logged meals."
        ),
        "category": "meals",
        "observation_count": comparison["observation_count"],
        "supporting_detail": (
            f"Compared {comparison['higher_count']} later-meal days with "
            f"{comparison['lower_count']} earlier-meal days, using only days "
            "with a biometric record on the following calendar day. This is "
            "an observational association, not evidence of causation."
        ),
    }, len(pairs)


def discover_personal_patterns(
    biometrics: list[Biometric],
    meals: list[Meal],
) -> dict:
    """Discover repeatable, non-causal associations in one user's records."""

    patterns = _discover_biometric_patterns(biometrics)
    meal_pattern, meal_timing_observations = _discover_meal_timing_pattern(
        biometrics,
        meals,
    )
    if meal_pattern is not None:
        patterns.append(meal_pattern)

    return {
        "biometric_observations": len(biometrics),
        "meal_timing_observations": meal_timing_observations,
        "minimum_observations": MIN_PATTERN_OBSERVATIONS,
        "minimum_group_observations": MIN_GROUP_OBSERVATIONS,
        "patterns": patterns,
    }
