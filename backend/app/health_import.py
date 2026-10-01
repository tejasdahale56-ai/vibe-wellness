"""Deterministic parser for manually exported daily health CSV files."""

import csv
import io
import math
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime
from statistics import mean
from typing import Optional


class HealthDataParseError(ValueError):
    """Raised when a CSV is malformed or contains invalid observations."""


@dataclass
class DailyBiometric:
    recorded_at: datetime
    sleep_minutes: Optional[int] = None
    steps: Optional[int] = None
    resting_heart_rate_bpm: Optional[int] = None
    hrv_milliseconds: Optional[int] = None
    energy_score: Optional[float] = None
    active_minutes: Optional[int] = None


@dataclass
class ParsedHealthData:
    days: list[DailyBiometric]
    warnings: list[str]
    metrics: list[str]


def _key(header: str) -> str:
    return re.sub(r"[^a-z0-9]", "", header.strip().lower())


ALIASES = {
    "steps": {"steps", "stepstaken"},
    "sleep": {"minutesasleep", "sleepminutes", "sleepdurationminutes", "totalminutesasleep"},
    "rhr": {"restingheartrate", "restingheartratebpm", "restinghr", "rhr"},
    "hrv": {"dailyrmssd", "hrv", "hrvmilliseconds", "hrvms"},
    "energy": {"energyscore", "energy"},
    "active": {"activeminutes", "totalactiveminutes"},
    "date": {"date", "activitydate", "dateofsleep", "recordedat", "datetime", "timestamp"},
}


def _parse_date(value: str) -> date:
    value = (value or "").strip()
    if not value:
        raise HealthDataParseError("A row is missing its date value.")
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d"):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                pass
    raise HealthDataParseError(f"Unrecognized date value: {value[:40]}")


def _number(value: Optional[str], metric: str, line: int) -> Optional[float]:
    if value is None or not value.strip():
        return None
    try:
        number = float(value.replace(",", "").strip())
    except ValueError as exc:
        raise HealthDataParseError(f"Invalid {metric} value on CSV row {line}.") from exc
    if not math.isfinite(number):
        raise HealthDataParseError(f"Invalid {metric} value on CSV row {line}.")
    if number < 0:
        raise HealthDataParseError(f"{metric.capitalize()} cannot be negative (row {line}).")
    if metric == "rhr" and number == 0:
        raise HealthDataParseError(f"Resting heart rate must be positive (row {line}).")
    if metric == "energy" and number > 10:
        raise HealthDataParseError(f"Energy score must be from 0 to 10 (row {line}).")
    maximums = {
        "steps": 200_000,
        "sleep": 1_440,
        "rhr": 250,
        "hrv": 1_000,
        "active": 1_440,
        "sleep duration": 86_400_000,
        "active minutes": 1_440,
    }
    if metric in maximums and number > maximums[metric]:
        raise HealthDataParseError(f"{metric.capitalize()} is outside the supported range (row {line}).")
    if metric in {"steps", "sleep", "rhr", "hrv", "active", "sleep duration", "active minutes"} and not number.is_integer():
        raise HealthDataParseError(f"{metric.capitalize()} must be a whole number (row {line}).")
    return number


def parse_health_csv(content: bytes) -> ParsedHealthData:
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HealthDataParseError("CSV must use UTF-8 encoding.") from exc
    try:
        reader = csv.DictReader(io.StringIO(text, newline=""), strict=True)
        if not reader.fieldnames:
            raise HealthDataParseError("CSV must include a header row.")
        headers = {_key(name): name for name in reader.fieldnames if name}
        selected = {
            metric: next((headers[alias] for alias in aliases if alias in headers), None)
            for metric, aliases in ALIASES.items()
        }
        if selected["date"] is None:
            raise HealthDataParseError("CSV needs a date, ActivityDate, or dateOfSleep column.")
        sleep_duration_header = headers.get("duration") if selected["sleep"] is None and "dateofsleep" in headers else None
        active_components = [headers.get(key) for key in ("minuteslightlyactive", "minutesfairlyactive", "minutesveryactive")]
        metric_headers = [selected[key] for key in ("steps", "sleep", "rhr", "hrv", "energy", "active")]
        if not any(metric_headers) and not sleep_duration_header and not any(active_components):
            raise HealthDataParseError("CSV has no recognized health metric columns.")

        grouped = defaultdict(lambda: defaultdict(list))
        skipped = 0
        for line, row in enumerate(reader, start=2):
            if None in row:
                raise HealthDataParseError(f"CSV row {line} has more values than the header.")
            if not any((value or "").strip() for value in row.values()):
                skipped += 1
                continue
            day = _parse_date(row.get(selected["date"]) or "")
            row_values = defaultdict(list)
            for metric in ("steps", "sleep", "rhr", "hrv", "energy", "active"):
                header = selected[metric]
                if header is None:
                    continue
                value = _number(row.get(header), metric, line)
                if value is not None:
                    row_values[metric].append(value)
            if sleep_duration_header:
                duration_ms = _number(row.get(sleep_duration_header), "sleep duration", line)
                if duration_ms is not None:
                    row_values["sleep"].append(duration_ms / 60000)
            if selected["active"] is None and any(active_components):
                component_values = [_number(row.get(header), "active minutes", line) for header in active_components if header]
                if any(value is not None for value in component_values):
                    row_values["active"].append(sum(value or 0 for value in component_values))
            if not row_values:
                skipped += 1
                continue
            for metric, values in row_values.items():
                grouped[day][metric].extend(values)
        if not grouped:
            raise HealthDataParseError("CSV contains no dated health observations.")

        def pick(values: list[float]) -> Optional[int]:
            return round(mean(values)) if values else None

        days = []
        for day in sorted(grouped):
            values = grouped[day]
            days.append(DailyBiometric(
                recorded_at=datetime.combine(day, datetime.min.time()),
                sleep_minutes=pick(values["sleep"]), steps=pick(values["steps"]),
                resting_heart_rate_bpm=pick(values["rhr"]), hrv_milliseconds=pick(values["hrv"]),
                energy_score=round(mean(values["energy"]), 2) if values["energy"] else None,
                active_minutes=pick(values["active"]),
            ))
        metrics = [name for key, name in (("sleep", "sleep_minutes"), ("steps", "steps"),
            ("rhr", "resting_heart_rate_bpm"), ("hrv", "hrv_milliseconds"),
            ("energy", "energy_score"), ("active", "active_minutes"))
            if selected[key] is not None or (key == "active" and any(active_components))]
        warnings = ["Blank rows and rows without measurements were ignored."] if skipped else []
        return ParsedHealthData(days, warnings, metrics)
    except csv.Error as exc:
        raise HealthDataParseError("CSV file is malformed.") from exc
