from datetime import date
from pathlib import PurePath

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..current_user import get_current_user
from ..database import get_db
from ..health_import import HealthDataParseError, parse_health_csv
from ..models import Biometric, User
from ..schemas import HealthDataImportResponse, HealthDataTodayResponse

router = APIRouter(prefix="/api/health-data", tags=["Daily Health Data"])
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


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
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "CSV file exceeds the 5 MB limit.")
    try:
        parsed = parse_health_csv(content)
    except HealthDataParseError as exc:
        raise HTTPException(400, str(exc)) from exc

    imported = []
    duplicates = 0
    for day in parsed.days:
        exists = db.query(Biometric.id).filter(
            Biometric.user_id == current_user.id,
            func.date(Biometric.recorded_at) == day.recorded_at.date().isoformat(),
        ).first()
        if exists:
            duplicates += 1
            continue
        imported.append(Biometric(user_id=current_user.id, **day.__dict__))
    try:
        db.add_all(imported)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Could not save imported health data.")
    return HealthDataImportResponse(
        filename=filename,
        days_imported=len(imported),
        days_skipped_as_duplicates=duplicates,
        date_range={"start": parsed.days[0].recorded_at.date().isoformat(),
                    "end": parsed.days[-1].recorded_at.date().isoformat()},
        imported_metrics=parsed.metrics,
        warnings=parsed.warnings,
    )


@router.get("/today", response_model=HealthDataTodayResponse)
def today_health_data(
    local_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    has_data = db.query(Biometric.id).filter(
        Biometric.user_id == current_user.id,
        func.date(Biometric.recorded_at) == local_date.isoformat(),
    ).first() is not None
    return HealthDataTodayResponse(local_date=local_date.isoformat(), has_data=has_data)

