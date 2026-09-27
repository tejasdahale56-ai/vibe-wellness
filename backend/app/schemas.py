from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# -------------------------
# Biometrics
# -------------------------

class BiometricBase(BaseModel):
    recorded_at: datetime
    sleep_minutes: int
    steps: int
    resting_heart_rate_bpm: int
    hrv_milliseconds: int
    energy_score: float
    active_minutes: int


class BiometricCreate(BiometricBase):
    pass


class BiometricResponse(BiometricBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Meals
# -------------------------

class MealBase(BaseModel):
    name: str
    meal_type: Optional[str] = None
    description: str
    logged_at: datetime
    time_label: str
    tags: list[str] = []


class MealCreate(MealBase):
    pass


class MealResponse(MealBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Experiments
# -------------------------

class ExperimentBase(BaseModel):
    title: str
    description: str
    why: Optional[str] = None
    context: Optional[str] = None
    duration_days: int
    progress_percent: int = 0
    status: str = "planned"
    status_label: str = "Planned"
    self_reported_energy: Optional[float] = None
    energy_after: Optional[float] = None
    baseline_energy: Optional[float] = None
    reflection: Optional[str] = None
    completed_at: Optional[datetime] = None
    pattern_saved: bool = False


class ExperimentCreate(ExperimentBase):
    pass


class ExperimentResponse(ExperimentBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Patterns
# -------------------------

class PatternBase(BaseModel):
    title: str
    description: str
    category: str
    observation_count: int = 0
    supporting_detail: str


class PatternCreate(PatternBase):
    pass


class PatternResponse(PatternBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Users
# -------------------------

class UserResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Insights
# -------------------------

class InsightComparison(BaseModel):
    comparable_days: int
    average_afternoon_energy: float


class InsightResponse(BaseModel):
    id: str
    date_label: Optional[str] = None
    heading: Optional[str] = None
    score: Optional[float] = None
    title: str
    summary: str
    context: Optional[str] = None
    method_note: Optional[str] = None

    comparison: InsightComparison

    category: str

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Dashboard
# -------------------------

class WellnessMetricResponse(BaseModel):
    id: str
    label: str
    value: str
    description: str
    icon: str
    tone: str


class DashboardResponse(BaseModel):
    biometrics: BiometricResponse
    metrics: list[WellnessMetricResponse]