from datetime import datetime
from typing import Literal, Optional

import re

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# -------------------------
# Biometrics
# -------------------------

class BiometricBase(BaseModel):
    recorded_at: datetime
    sleep_minutes: Optional[int] = Field(default=None, ge=0)
    steps: Optional[int] = Field(default=None, ge=0)
    resting_heart_rate_bpm: Optional[int] = Field(default=None, gt=0)
    hrv_milliseconds: Optional[int] = Field(default=None, ge=0)
    energy_score: Optional[float] = Field(default=None, ge=0, le=10)
    active_minutes: Optional[int] = Field(default=None, ge=0)


class BiometricCreate(BiometricBase):
    @model_validator(mode="after")
    def require_a_measurement(self):
        metric_fields = (
            "sleep_minutes", "steps", "resting_heart_rate_bpm",
            "hrv_milliseconds", "energy_score", "active_minutes",
        )
        if all(getattr(self, field) is None for field in metric_fields):
            raise ValueError("At least one biometric measurement is required.")
        return self


class BiometricResponse(BiometricBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class PersonalMetricBaselineInput(BaseModel):
    sleep_minutes: float = Field(gt=0, le=1440)
    steps: float = Field(ge=0, le=200000)
    resting_heart_rate_bpm: float = Field(gt=0, le=250)
    hrv_milliseconds: float = Field(ge=0, le=1000)
    energy_score: float = Field(ge=0, le=10)
    active_minutes: float = Field(ge=0, le=1440)


class PersonalMetricBaselineResponse(PersonalMetricBaselineInput):
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Meals
# -------------------------

class MealBase(BaseModel):
    name: str
    meal_type: Optional[str] = None
    description: str = Field(min_length=1)
    logged_at: datetime
    time_label: str
    tags: list[str] = Field(default_factory=list)
    portion_size: Optional[Literal["small", "medium", "large"]] = "medium"

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("description must not be blank")
        return value


class MealCreate(MealBase):
    portion_size: Literal["small", "medium", "large"] = "medium"


class MealResponse(MealBase):
    id: int
    user_id: int
    estimated_calories: Optional[int] = Field(default=None, ge=0)
    estimated_protein_g: Optional[int] = Field(default=None, ge=0)
    estimated_carbs_g: Optional[int] = Field(default=None, ge=0)
    estimated_fat_g: Optional[int] = Field(default=None, ge=0)
    estimated_fiber_g: Optional[int] = Field(default=None, ge=0)
    nutrition_confidence: Optional[Literal["low", "medium"]] = None
    nutrition_estimate_note: Optional[str] = None

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


class ExperimentMeasurementValue(BaseModel):
    baseline: float
    experiment_period: float
    observed_difference: float


class ExperimentMeasurementResponse(BaseModel):
    id: int
    title: str
    description: str
    hypothesis: Optional[str] = None
    context: Optional[str] = None
    duration_days: int = Field(gt=0)
    completed_at: datetime
    baseline_energy: Optional[float] = None
    experiment_period_energy: Optional[float] = None
    observed_energy_difference: Optional[float] = None
    baseline_observation_count: int = Field(ge=0)
    experiment_period_observation_count: int = Field(ge=0)
    usable_observation_count: int = Field(ge=0)
    sufficient_data: bool
    minimum_baseline_observations: int = Field(gt=0)
    minimum_experiment_period_observations: int = Field(gt=0)
    experiment_period_source: Literal[
        "biometric_history",
        "completion_check_in",
        "unavailable",
    ]
    reflection: Optional[str] = None
    additional_measurements: dict[str, ExperimentMeasurementValue]
    summary: str


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


class AuthCredentials(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("email must be valid")
        return normalized


class SignupRequest(AuthCredentials):
    name: str = Field(min_length=1, max_length=100)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("name must not be blank")
        return normalized


# -------------------------
# Goals
# -------------------------

class PrimaryGoalUpsert(BaseModel):
    goal_type: Literal[
        "energy",
        "sleep",
        "recovery",
        "movement",
        "meals",
        "focus",
        "custom",
    ]
    display_label: str = Field(min_length=1, max_length=100)
    custom_text: Optional[str] = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_custom_goal(self):
        if self.goal_type == "custom" and not (self.custom_text or "").strip():
            raise ValueError("custom_text is required for a custom goal")
        return self


class PrimaryGoalResponse(PrimaryGoalUpsert):
    id: int
    created_at: datetime
    updated_at: datetime

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


class DiscoveredPatternResponse(BaseModel):
    title: str
    description: str
    category: Literal["sleep", "movement", "recovery", "meals"]
    observation_count: int = Field(ge=0)
    supporting_detail: str


class PersonalPatternDiscoveryResponse(BaseModel):
    biometric_observations: int = Field(ge=0)
    meal_timing_observations: int = Field(ge=0)
    minimum_observations: int = Field(gt=0)
    minimum_group_observations: int = Field(gt=0)
    patterns: list[DiscoveredPatternResponse]


# -------------------------
# History
# -------------------------

class HistoryEventResponse(BaseModel):
    type: Literal["biometric", "meal", "experiment", "pattern", "goal"]
    timestamp: datetime
    title: str
    description: str
    metadata: dict[str, object]


class HealthDataImportResponse(BaseModel):
    filename: str
    days_imported: int = Field(ge=0)
    days_skipped_as_duplicates: int = Field(ge=0)
    date_range: Optional[dict[str, str]] = None
    imported_metrics: list[str]
    warnings: list[str]


class HealthDataTodayResponse(BaseModel):
    local_date: str
    has_data: bool
