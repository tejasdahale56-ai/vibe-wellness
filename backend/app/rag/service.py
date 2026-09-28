from .retriever import retrieve_relevant_records
from .generator import generate_insight


def build_insight(
    user_id: int,
    records: list[dict],
    question: str,
) -> dict:

    relevant_records = retrieve_relevant_records(
        records=records,
        query=question,
        top_k=5,
    )

    if not relevant_records:
        relevant_records = records[:5]

    return generate_insight(
        user_id=user_id,
        context=relevant_records,
        question=question,
    )
