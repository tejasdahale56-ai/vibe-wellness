from typing import Any


def _text_from_record(record: dict[str, Any]) -> str:
    parts = []

    for key, value in record.items():
        parts.append(f"{key}: {value}")

    return " ".join(parts).lower()


def _score_record(
    record: dict[str, Any],
    query_words: set[str],
) -> int:

    text = _text_from_record(record)

    score = 0

    for word in query_words:
        if word and word in text:
            score += 1

    return score


def retrieve_relevant_records(
    records: list[dict[str, Any]],
    query: str,
    top_k: int = 5,
) -> list[dict[str, Any]]:

    query_words = {
        word.lower().strip(".,!?")
        for word in query.split()
        if len(word) > 2
    }

    scored = []

    for record in records:
        score = _score_record(
            record,
            query_words,
        )

        scored.append(
            (score, record)
        )

    scored.sort(
        key=lambda item: item[0],
        reverse=True,
    )

    return [
        record
        for score, record in scored[:top_k]
        if score > 0
    ]
