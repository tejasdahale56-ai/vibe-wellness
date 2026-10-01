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

    firebase_uid: Mapped[Optional[str]] = mapped_column(
        String(128),
        unique=True,
        index=True,
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
