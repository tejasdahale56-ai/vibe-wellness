import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.rag.service import build_insight


records = [
    {
        "type": "meal",
        "name": "Chicken Biryani",
        "date": "2026-09-28",
    },
    {
        "type": "meal",
        "name": "Oatmeal",
        "date": "2026-09-27",
    },
    {
        "type": "experiment",
        "name": "Drink water before lunch",
        "date": "2026-09-27",
    },
]


result = build_insight(
    user_id=1,
    records=records,
    question="What patterns do you notice in my recent meals?",
)


print(result)