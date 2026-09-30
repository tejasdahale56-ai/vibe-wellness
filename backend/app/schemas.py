from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# -------------------------
# Biometrics
# -------------------------

class BiometricBase(BaseModel):
    recorded_at: datetime
    sleep_minutes: int = Field(ge=0)
    steps: int = Field(ge=0)
    resting_heart_rate_bpm: int = Field(gt=0)
    hrv_milliseconds: int = Field(ge=0)
    energy_score: float = Field(ge=0, le=10)
    active_minutes: int = Field(ge=0)


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
    duration_days: int = Field(gt=0)
    progress_percent: int = Field(default=0, ge=0, le=100)
    status: Literal["planned", "active", "completed"] = "planned"
    status_label: str = "Planned"
    self_reported_energy: Optional[float] = Field(
        default=None,
        ge=0,
        le=10,
    )
    energy_after: Optional[float] = Field(
        default=None,
        ge=0,
        le=10,
    )
    baseline_energy: Optional[float] = Field(
        default=None,
        ge=0,
        le=10,
    )
    reflection: Optional[str] = None
    completed_at: Optional[datetime] = None
    pattern_saved: bool = False


class ExperimentCreate(ExperimentBase):
    pass


class ExperimentResponse(ExperimentBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class ExperimentEnergySummary(BaseModel):
    completed_experiments: int = Field(ge=0)
    analyzed_experiments: int = Field(ge=0)
    average_energy_change: Optional[float] = None
    positive_energy_changes: int = Field(ge=0)
    negative_energy_changes: int = Field(ge=0)
    enough_data_for_pattern: bool
    minimum_experiments_for_pattern: int = Field(gt=0)


# -------------------------
# Patterns
# -------------------------

class PatternBase(BaseModel):
    title: str
    description: str
    category: Literal["sleep", "meals", "movement"]
    observation_count: int = Field(default=0, ge=0)
    supporting_detail: str


class PatternCreate(PatternBase):
    pass


class PatternResponse(PatternBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class PatternObservation(BaseModel):
    kind: str
    feature_type: str
    feature_value: str
    positive_experiments_with_feature: int = Field(ge=0)
    positive_experiments_analyzed: int = Field(ge=0)
    repetition_rate: float = Field(ge=0, le=1)
    window_rule: str
    causal_claim: bool


class PatternAnalysisResponse(BaseModel):
    completed_experiments: int = Field(ge=0)
    measurable_completed_experiments: int = Field(ge=0)
    positive_energy_experiments: int = Field(ge=0)
    positive_experiments_analyzed: int = Field(ge=0)
    enough_data_for_pattern: bool
    minimum_positive_experiments: int = Field(gt=0)
    observations: list[PatternObservation]


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
    average_afternoon_energy: Optional[float] = None
    average_experiment_energy_change: Optional[float] = None


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

    category: Literal["sleep", "movement", "nutrition", "mood", "general"]

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


# -------------------------
# Analytics
# -------------------------

class PersonalBaselineMetricResponse(BaseModel):
    baseline: Optional[float] = None
    latest: Optional[float] = None
    difference: Optional[float] = None


class PersonalBaselineResponse(BaseModel):
    observation_count: int = Field(ge=0)
    latest_recorded_at: Optional[datetime] = None
    metrics: dict[str, PersonalBaselineMetricResponse]
