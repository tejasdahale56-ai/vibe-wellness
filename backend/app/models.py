from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        default="Demo User",
    )

    email: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
    )

    # Nullable so existing demo users remain intact. Only users created
    # through /api/auth/signup can authenticate with a password.
    password_hash: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    biometrics: Mapped[list["Biometric"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    meals: Mapped[list["Meal"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    experiments: Mapped[list["Experiment"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    patterns: Mapped[list["Pattern"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )

    primary_goal: Mapped[Optional["Goal"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False,
    )

    sessions: Mapped[list["UserSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    # Store only a digest of the high-entropy opaque cookie token.
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="sessions")


class Biometric(Base):
    __tablename__ = "biometrics"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
    )

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime,
        index=True,
    )

    sleep_minutes: Mapped[int] = mapped_column(
        Integer,
    )

    steps: Mapped[int] = mapped_column(
        Integer,
    )

    resting_heart_rate_bpm: Mapped[int] = mapped_column(
        Integer,
    )

    hrv_milliseconds: Mapped[int] = mapped_column(
        Integer,
    )

    energy_score: Mapped[float] = mapped_column(
        Float,
    )

    active_minutes: Mapped[int] = mapped_column(
        Integer,
    )

    user: Mapped["User"] = relationship(
        back_populates="biometrics",
    )


class Meal(Base):
    __tablename__ = "meals"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
    )

    meal_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
    )

    logged_at: Mapped[datetime] = mapped_column(
        DateTime,
        index=True,
    )

    time_label: Mapped[str] = mapped_column(
        String(20),
    )

    # Stored as JSON so the API returns a proper list of strings.
    # Example: ["rice", "chicken", "lunch"]
    tags: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
    )

    # These are deterministic, coarse estimates, not measured nutrition data.
    # Nullable fields preserve existing meal records and unknown descriptions.
    portion_size: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
    )

    estimated_calories: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    estimated_protein_g: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    estimated_carbs_g: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    estimated_fat_g: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    estimated_fiber_g: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    nutrition_confidence: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )

    @property
    def nutrition_estimate_note(self) -> Optional[str]:
        if self.estimated_calories is None:
            return None
        return "Estimated from recognized meal text and portion size."

    user: Mapped["User"] = relationship(
        back_populates="meals",
    )


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
    )

    # Nullable preserves existing records created before history support.
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
    )

    description: Mapped[str] = mapped_column(
        Text,
    )

    why: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    context: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    duration_days: Mapped[int] = mapped_column(
        Integer,
    )

    progress_percent: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="planned",
    )

    status_label: Mapped[str] = mapped_column(
        String(50),
        default="Planned",
    )

    self_reported_energy: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    energy_after: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    baseline_energy: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    reflection: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
    )

    pattern_saved: Mapped[bool] = mapped_column(
        default=False,
    )

    user: Mapped["User"] = relationship(
        back_populates="experiments",
    )


class Pattern(Base):
    __tablename__ = "patterns"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        index=True,
    )

    # Nullable preserves existing records created before history support.
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
    )

    description: Mapped[str] = mapped_column(
        Text,
    )

    category: Mapped[str] = mapped_column(
        String(50),
    )

    observation_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    supporting_detail: Mapped[str] = mapped_column(
        Text,
    )

    user: Mapped["User"] = relationship(
        back_populates="patterns",
    )


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        unique=True,
        index=True,
    )

    goal_type: Mapped[str] = mapped_column(
        String(50),
    )

    display_label: Mapped[str] = mapped_column(
        String(100),
    )

    custom_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user: Mapped["User"] = relationship(
        back_populates="primary_goal",
    )
