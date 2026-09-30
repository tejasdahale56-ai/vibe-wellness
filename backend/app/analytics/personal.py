from statistics import mean
from typing import Optional

from sqlalchemy.orm import Session

from ..models import Biometric, Meal


def average(values: list[float]) -> float:
    """Return a rounded average, or 0 when there is no data."""
    if not values:
        return 0.0

    return round(mean(values), 2)


def get_biometric_history(
    db: Session,
    user_id: int,
) -> list[Biometric]:
    """Return biometric history for a user, oldest first."""

    return (
        db.query(Biometric)
        .filter(Biometric.user_id == user_id)
        .order_by(Biometric.recorded_at.asc())
        .all()
    )


def get_meal_history(
    db: Session,
    user_id: int,
) -> list[Meal]:
    """Return meal history for a user, oldest first."""

    return (
        db.query(Meal)
        .filter(Meal.user_id == user_id)
        .order_by(Meal.logged_at.asc())
        .all()
    )


def calculate_baseline(
    biometrics: list[Biometric],
) -> dict:
    """
    Calculate simple personal baselines from the user's
    available biometric history.
    """

    if not biometrics:
        return {
            "days": 0,
            "average_sleep_minutes": None,
            "average_steps": None,
            "average_resting_heart_rate_bpm": None,
            "average_hrv_milliseconds": None,
            "average_energy_score": None,
            "average_active_minutes": None,
        }

    return {
        "days": len(biometrics),
        "average_sleep_minutes": average(
            [float(item.sleep_minutes) for item in biometrics]
        ),
        "average_steps": average(
            [float(item.steps) for item in biometrics]
        ),
        "average_resting_heart_rate_bpm": average(
            [
                float(item.resting_heart_rate_bpm)
                for item in biometrics
            ]
        ),
        "average_hrv_milliseconds": average(
            [float(item.hrv_milliseconds) for item in biometrics]
        ),
        "average_energy_score": average(
            [float(item.energy_score) for item in biometrics]
        ),
        "average_active_minutes": average(
            [float(item.active_minutes) for item in biometrics]
        ),
    }


def find_similar_sleep_days(
    biometrics: list[Biometric],
    target_sleep_minutes: int,
    tolerance_minutes: int = 45,
) -> list[Biometric]:
    """
    Find days whose sleep duration is reasonably close to
    the target day's sleep duration.
    """

    return [
        item
        for item in biometrics
        if abs(item.sleep_minutes - target_sleep_minutes)
        <= tolerance_minutes
    ]


def compare_sleep_and_energy(
    biometrics: list[Biometric],
) -> dict:
    """
    Compare lower-sleep days with higher-sleep days.

    This is an observational comparison only. It does not
    establish causation.
    """

    if not biometrics:
        return {
            "low_sleep_days": 0,
            "normal_sleep_days": 0,
            "low_sleep_average_energy": None,
            "normal_sleep_average_energy": None,
            "difference": None,
        }

    average_sleep = mean(
        item.sleep_minutes for item in biometrics
    )

    low_sleep_days = [
        item
        for item in biometrics
        if item.sleep_minutes < average_sleep
    ]

    normal_sleep_days = [
        item
        for item in biometrics
        if item.sleep_minutes >= average_sleep
    ]

    low_sleep_energy = (
        average([item.energy_score for item in low_sleep_days])
        if low_sleep_days
        else None
    )

    normal_sleep_energy = (
        average([item.energy_score for item in normal_sleep_days])
        if normal_sleep_days
        else None
    )

    return {
        "low_sleep_days": len(low_sleep_days),
        "normal_sleep_days": len(normal_sleep_days),
        "low_sleep_average_energy": low_sleep_energy,
        "normal_sleep_average_energy": normal_sleep_energy,
        "difference": (
            round(normal_sleep_energy - low_sleep_energy, 2)
            if low_sleep_energy is not None
            and normal_sleep_energy is not None
            else None
        ),
    }


def calculate_current_deviation(
    biometrics: list[Biometric],
) -> dict:
    """
    Compare the most recent biometric record against
    the user's historical baseline.
    """

    if not biometrics:
        return {}

    baseline = calculate_baseline(biometrics)
    current = biometrics[-1]

    return {
        "sleep_minutes": round(
            current.sleep_minutes
            - baseline["average_sleep_minutes"],
            2,
        ),
        "steps": round(
            current.steps
            - baseline["average_steps"],
            2,
        ),
        "resting_heart_rate_bpm": round(
            current.resting_heart_rate_bpm
            - baseline["average_resting_heart_rate_bpm"],
            2,
        ),
        "hrv_milliseconds": round(
            current.hrv_milliseconds
            - baseline["average_hrv_milliseconds"],
            2,
        ),
        "energy_score": round(
            current.energy_score
            - baseline["average_energy_score"],
            2,
        ),
        "active_minutes": round(
            current.active_minutes
            - baseline["average_active_minutes"],
            2,
        ),
    }


def build_insight(
    biometrics: list[Biometric],
    meals: Optional[list[Meal]] = None,
) -> dict:
    """
    Produce a structured personal insight.

    This is deliberately deterministic and transparent.
    An LLM can consume this structured result later,
    but the analytics layer itself does not use an LLM.
    """

    if not biometrics:
        return {
            "id": "insight-insufficient-data",
            "date_label": None,
            "heading": "Not enough data yet.",
            "score": None,
            "title": "Keep collecting data.",
            "summary": (
                "VIBE needs more personal observations before "
                "it can identify a meaningful pattern."
            ),
            "context": None,
            "method_note": (
                "The insight is generated from personal biometric "
                "history and available meal context."
            ),
            "comparison": {
                "comparable_days": 0,
                "average_afternoon_energy": None,
            },
            "category": "general",
        }

    baseline = calculate_baseline(biometrics)
    sleep_comparison = compare_sleep_and_energy(biometrics)
    deviation = calculate_current_deviation(biometrics)

    current = biometrics[-1]

    # Use the recent history as the comparison group.
    comparable_days = max(len(biometrics) - 1, 0)

    previous_days = biometrics[:-1]

    if previous_days:
        comparison_energy = average(
            [
                item.energy_score
                for item in previous_days
            ]
        )
    else:
        comparison_energy = current.energy_score

    # Determine whether the current day is below the
    # user's recent energy average.
    energy_difference = round(
        current.energy_score - comparison_energy,
        2,
    )

    # Build the main insight.
    if (
        sleep_comparison["low_sleep_days"] >= 2
        and sleep_comparison["difference"] is not None
        and sleep_comparison["difference"] > 0.5
    ):
        title = "Shorter-sleep days have coincided with lower energy."

        summary = (
            f"Across {sleep_comparison['low_sleep_days']} "
            f"lower-sleep days, reported energy averaged "
            f"{sleep_comparison['low_sleep_average_energy']} / 10, "
            f"compared with "
            f"{sleep_comparison['normal_sleep_average_energy']} / 10 "
            f"on days at or above your typical sleep duration."
        )

        context = (
            "This is an observational pattern in your personal data. "
            "It does not establish that sleep duration caused the "
            "difference in energy."
        )

        category = "sleep"

    elif energy_difference < -0.3:
        title = "Your energy is lower than your recent baseline."

        summary = (
            f"Your latest reported energy was "
            f"{current.energy_score} / 10, compared with "
            f"{comparison_energy} / 10 across the previous "
            f"{comparable_days} recorded days."
        )

        context = (
            "VIBE is comparing today's signals with your own "
            "recent history rather than a population average."
        )

        category = "general"

    elif energy_difference > 0.3:
        title = "Your energy is higher than your recent baseline."

        summary = (
            f"Your latest reported energy was "
            f"{current.energy_score} / 10, compared with "
            f"{comparison_energy} / 10 across the previous "
            f"{comparable_days} recorded days."
        )

        context = (
            "This is a personal comparison based on your recent "
            "recorded days."
        )

        category = "general"

    else:
        title = "Your energy is close to your recent baseline."

        summary = (
            f"Your latest reported energy was "
            f"{current.energy_score} / 10, close to your recent "
            f"average of {comparison_energy} / 10."
        )

        context = (
            "No large deviation from your recent personal baseline "
            "was detected."
        )

        category = "general"

    return {
        "id": f"biometric-{current.id}",
        "date_label": current.recorded_at.strftime("%b %d"),
        "heading": "Personal pattern detected",
        "score": round(current.energy_score, 1),
        "title": title,
        "summary": summary,
        "context": context,
        "method_note": (
            "VIBE compared your recent biometric history and "
            "available meal context against your own personal "
            "baseline. This is an observational analysis, "
            "not a medical diagnosis or causal conclusion."
        ),
        "comparison": {
            "comparable_days": comparable_days,
            "average_afternoon_energy": comparison_energy,
        },
        "category": category,
        "baseline": baseline,
        "current_deviation": deviation,
        "sleep_comparison": sleep_comparison,
    }
