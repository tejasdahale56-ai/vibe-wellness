import logging
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Experiment, Meal, Biometric


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"],
)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_id: int = 1


class ChatResponse(BaseModel):
    message: str


def _fetch_user_context(db: Session, user_id: int) -> str:
    context_parts = []

    meals = (
        db.query(Meal)
        .filter(Meal.user_id == user_id)
        .order_by(Meal.logged_at.desc())
        .limit(10)
        .all()
    )
    if meals:
        meal_strs = [f"- {m.name} ({m.meal_type or 'meal'}): {m.description}" for m in meals]
        context_parts.append("Recent meals:\n" + "\n".join(meal_strs))

    biometrics = (
        db.query(Biometric)
        .filter(Biometric.user_id == user_id)
        .order_by(Biometric.recorded_at.desc())
        .limit(7)
        .all()
    )
    if biometrics:
        bio_strs = [
            f"- {b.recorded_at.strftime('%Y-%m-%d')}: Sleep {round(b.sleep_minutes/60,1)}h, "
            f"Steps {b.steps}, Energy {b.energy_score}/10, HRV {b.hrv_milliseconds}ms, "
            f"Active {b.active_minutes}min, RHR {b.resting_heart_rate_bpm}bpm"
            for b in biometrics
        ]
        context_parts.append("Recent biometrics:\n" + "\n".join(bio_strs))

    experiments = (
        db.query(Experiment)
        .filter(Experiment.user_id == user_id)
        .order_by(Experiment.id.desc())
        .limit(5)
        .all()
    )
    if experiments:
        exp_strs = [
            f"- {e.title}: {e.description} (Status: {e.status_label})"
            + (f" Reflection: {e.reflection}" if e.reflection else "")
            for e in experiments
        ]
        context_parts.append("Experiments:\n" + "\n".join(exp_strs))

    return "\n\n".join(context_parts) if context_parts else "No wellness data available yet."


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        from openai import OpenAI
        import os

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="Chat service is not configured.",
            )

        client = OpenAI(api_key=api_key)

        user_context = _fetch_user_context(db, request.user_id)

        system_prompt = f"""You are VIBE, a gentle wellness companion. You help users understand their patterns and experiments without being prescriptive.

User's wellness context:
{user_context}

Guidelines:
- Be conversational, warm, and non-judgmental
- Reference their actual data when relevant
- Don't diagnose or give medical advice
- Encourage curiosity and self-discovery
- Keep responses concise (2-4 sentences typically)
- Use their name (Alex) occasionally
- Focus on patterns they can observe themselves"""

        messages = [
            {"role": "system", "content": system_prompt},
            *[{"role": msg.role, "content": msg.content} for msg in request.messages],
        ]

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7,
            max_tokens=300,
        )

        return ChatResponse(message=response.choices[0].message.content.strip())

    except HTTPException:
        raise
    except Exception:
        logger.exception("Chat request failed")
        raise HTTPException(
            status_code=503,
            detail="Chat service is temporarily unavailable.",
        ) from None
