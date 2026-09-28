import json
import os

from dotenv import load_dotenv
from openai import OpenAI, OpenAIError

from .prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


load_dotenv()


client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


MODEL = os.getenv(
    "OPENAI_MODEL",
    "gpt-5.6-luna",
)


def _generate_mock_insight(
    user_id: int,
    context: list[dict],
    question: str,
) -> dict:
    evidence = []
    for record in context:
        rec_type = str(record.get("type", "record")).capitalize()
        rec_name = record.get("name", record.get("title", "log"))
        rec_date = record.get("date", "")
        evidence.append(f"{rec_type}: '{rec_name}' logged on {rec_date}")

    names = [r.get("name") for r in context if "name" in r]
    summary = (
        f"Analyzed {len(context)} relevant record(s) for user #{user_id}. "
        f"Logged items: {', '.join(names)}. "
        f"Patterns indicate regular meal logging with associated wellness experiments."
    )

    return {
        "title": "Meal & Experiment Pattern Summary",
        "summary": summary,
        "evidence": evidence,
        "confidence": "medium",
    }


def generate_insight(
    user_id: int,
    context: list[dict],
    question: str,
) -> dict:

    if os.getenv("USE_MOCK_RAG", "false").lower() in ("true", "1"):
        return _generate_mock_insight(user_id, context, question)

    context_text = json.dumps(
        context,
        indent=2,
        default=str,
    )

    user_prompt = USER_PROMPT_TEMPLATE.format(
        user_id=user_id,
        context=context_text,
        question=question,
    )

    try:
        response = client.responses.create(
            model=MODEL,
            instructions=SYSTEM_PROMPT,
            input=user_prompt,
        )

        text = response.output_text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {
                "title": "Insight",
                "summary": text,
                "evidence": [],
                "confidence": "low",
            }
    except OpenAIError as e:
        # Fallback to local mock insight when API call fails (e.g. credit exhausted)
        mock_result = _generate_mock_insight(user_id, context, question)
        mock_result["note"] = f"Generated locally (OpenAI {type(e).__name__}: credit exhausted)"
        return mock_result


