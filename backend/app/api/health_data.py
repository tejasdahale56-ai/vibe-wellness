from datetime import date, datetime, time, timedelta
from pathlib import PurePath

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..current_user import get_current_user
from ..database import get_db
from ..health_import import HealthDataParseError, parse_health_csv
from ..models import Biometric, User
from ..schemas import HealthDataImportResponse, HealthDataTodayResponse

router = APIRouter(prefix="/api/health-data", tags=["Daily Health Data"])
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min)
    return start, start + timedelta(days=1)


@router.post("/import", response_model=HealthDataImportResponse)
async def import_health_data(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filename = PurePath(file.filename or "upload.csv").name
    if not filename.lower().endswith(".csv"):
        raise HTTPException(415, "Upload a CSV file.")
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "CSV file exceeds the 5 MB limit.")
    try:
        parsed = parse_health_csv(content)
    except HealthDataParseError as exc:
        raise HTTPException(400, str(exc)) from exc

    imported = 0
    duplicates = 0
    try:
        for day in parsed.days:
            day_start, day_end = _day_bounds(day.recorded_at.date())
            existing = db.query(Biometric).filter(
                Biometric.user_id == current_user.id,
                Biometric.recorded_at >= day_start,
                Biometric.recorded_at < day_end,
            ).order_by(Biometric.recorded_at.desc(), Biometric.id.desc()).first()
            if existing is None:
                db.add(Biometric(user_id=current_user.id, **day.__dict__))
                imported += 1
                continue
            changed = False
            for field, value in day.__dict__.items():
                if field == "recorded_at" or value is None:
                    continue
                # Preserve manually entered or previously imported values.
                if getattr(existing, field) is None:
                    setattr(existing, field, value)
                    changed = True
            if changed:
                imported += 1
            else:
                duplicates += 1
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(500, "Could not save imported health data.") from exc

    return HealthDataImportResponse(
        filename=filename,
        days_imported=imported,
        days_skipped_as_duplicates=duplicates,
        date_range={"start": parsed.days[0].recorded_at.date().isoformat(), "end": parsed.days[-1].recorded_at.date().isoformat()},
        imported_metrics=parsed.metrics,
        warnings=parsed.warnings,
    )


@router.get("/today", response_model=HealthDataTodayResponse)
def today_health_data(
    local_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    day_start, day_end = _day_bounds(local_date)
    has_data = db.query(Biometric.id).filter(
        Biometric.user_id == current_user.id,
        Biometric.recorded_at >= day_start,
        Biometric.recorded_at < day_end,
    ).first() is not None
    return HealthDataTodayResponse(local_date=local_date.isoformat(), has_data=has_data)
