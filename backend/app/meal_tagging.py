"""Small deterministic text matching for meal tags.

These tags describe keyword matches only. They are not nutritional analysis.
"""

import re
from collections.abc import Iterable
from datetime import datetime


TAG_KEYWORDS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("protein", ("chicken", "egg", "eggs", "fish", "tofu", "paneer", "dal", "lentil", "lentils", "beans", "chickpeas", "meat")),
    ("dairy", ("curd", "yogurt", "milk", "cheese", "paneer")),
    ("grains", ("rice", "biryani", "bread", "roti", "naan", "pasta", "oats", "cereal", "quinoa", "sandwich")),
    ("vegetables", ("vegetable", "vegetables", "salad", "spinach", "broccoli", "carrot", "tomato", "cucumber", "potato")),
    ("fruit", ("fruit", "apple", "banana", "orange", "mango", "berries", "berry")),
    ("high_carb", ("rice", "biryani", "bread", "roti", "naan", "pasta", "potato", "sandwich", "sweets")),
    ("high_fat", ("fried", "butter", "ghee", "cream", "creamy", "cheese")),
    ("sweet", ("sweet", "sweets", "dessert", "cake", "cookie", "chocolate", "ice cream")),
    ("caffeine", ("coffee", "espresso", "cappuccino", "tea", "chai")),
    ("spicy", ("spicy", "biryani", "curry", "chili", "chilli")),
)


def normalize_tags(tags: Iterable[str]) -> list[str]:
    """Lowercase, trim, and de-duplicate tags while keeping their order."""

    normalized: list[str] = []
    for tag in tags:
        cleaned = tag.strip().lower()
        if cleaned and cleaned not in normalized:
            normalized.append(cleaned)
    return normalized


def extract_heuristic_tags(*texts: str) -> list[str]:
    """Return ordered category tags matched by known meal-text keywords."""

    combined_text = " ".join(texts).lower()
    normalized_text = re.sub(r"[^a-z0-9]+", " ", combined_text)
    padded_text = f" {normalized_text} "
    tags = [
        category
        for category, keywords in TAG_KEYWORDS
        if any(f" {keyword} " in padded_text for keyword in keywords)
    ]
    return tags or ["other"]


def merge_meal_tags(
    submitted_tags: Iterable[str],
    *meal_texts: str,
) -> list[str]:
    """Preserve submitted tags and append deterministic text-match tags."""

    return normalize_tags([
        *submitted_tags,
        *extract_heuristic_tags(*meal_texts),
    ])


def infer_meal_type(logged_at: datetime) -> str | None:
    """Infer a simple label from the existing logged-meal time when absent."""

    hour = logged_at.hour
    if 5 <= hour < 11:
        return "Breakfast"
    if 11 <= hour < 16:
        return "Lunch"
    if 16 <= hour < 18:
        return "Snack"
    if 18 <= hour < 23:
        return "Dinner"
    return None
