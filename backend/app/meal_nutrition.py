"""Coarse, deterministic meal nutrition estimates for the prototype.

The table intentionally contains only a few common, meal-level phrases. A
description selects at most one best phrase; matches are never summed, because
the text does not establish ingredient amounts.
"""

import re
from dataclasses import dataclass
from typing import Literal, Optional


PortionSize = Literal["small", "medium", "large"]


@dataclass(frozen=True)
class FoodEstimate:
    phrase: str
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int
    fiber_g: int
    confidence: Literal["low", "medium"]


# Medium-portion reference estimates. These are deliberately small in scope
# and are not a substitute for measured nutrition information.
FOOD_ESTIMATES: tuple[FoodEstimate, ...] = (
    FoodEstimate("chicken biryani", 650, 28, 75, 25, 5, "medium"),
    FoodEstimate("dal rice", 480, 18, 80, 10, 10, "medium"),
    FoodEstimate("vegetable sandwich", 350, 12, 48, 14, 6, "medium"),
    FoodEstimate("paneer curry", 430, 22, 18, 30, 4, "medium"),
    FoodEstimate("oatmeal", 300, 10, 50, 7, 8, "low"),
    FoodEstimate("sandwich", 350, 12, 48, 14, 6, "low"),
)

PORTION_MULTIPLIERS: dict[PortionSize, float] = {
    "small": 0.75,
    "medium": 1.0,
    "large": 1.25,
}


def _normalized_text(*texts: str) -> str:
    return f" {re.sub(r'[^a-z0-9]+', ' ', ' '.join(texts).lower())} "


def _find_best_food_estimate(*texts: str) -> Optional[FoodEstimate]:
    normalized_text = _normalized_text(*texts)
    matches = [
        estimate
        for estimate in FOOD_ESTIMATES
        if f" {estimate.phrase} " in normalized_text
    ]
    if not matches:
        return None
    return max(matches, key=lambda estimate: len(estimate.phrase))


def estimate_meal_nutrition(
    *texts: str,
    portion_size: Optional[PortionSize],
) -> dict[str, int | str | None]:
    """Return a single conservative estimate, or nulls for unknown meals."""

    food_estimate = _find_best_food_estimate(*texts)
    if food_estimate is None:
        return {
            "estimated_calories": None,
            "estimated_protein_g": None,
            "estimated_carbs_g": None,
            "estimated_fat_g": None,
            "estimated_fiber_g": None,
            "nutrition_confidence": None,
        }

    multiplier = PORTION_MULTIPLIERS[portion_size or "medium"]
    return {
        "estimated_calories": round(food_estimate.calories * multiplier),
        "estimated_protein_g": round(food_estimate.protein_g * multiplier),
        "estimated_carbs_g": round(food_estimate.carbs_g * multiplier),
        "estimated_fat_g": round(food_estimate.fat_g * multiplier),
        "estimated_fiber_g": round(food_estimate.fiber_g * multiplier),
        "nutrition_confidence": food_estimate.confidence,
    }
