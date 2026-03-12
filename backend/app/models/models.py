import uuid
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, Time, Text,
    DateTime, ForeignKey, Enum, JSON, SmallInteger, UniqueConstraint, Index
)
from sqlalchemy.ext.mutable import MutableDict

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class SlotType(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    BOTH = "both"


# ─── Test ─────────────────────────────────────────────────────────────────────

class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True)
    hash = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    payload = Column(MutableDict.as_mutable(JSON), nullable=True)  # {1: {answer: "...", point: 1}, ...}
    completed_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="tests", foreign_keys=[user_id])
    preliminary_conclusions = relationship("PreliminaryConclusion", back_populates="test")

    @property
    def points(self) -> int:
        if not self.payload:
            return 0
        return sum(v.get("point", 0) for v in self.payload.values() if isinstance(v, dict))

    @property
    def neurocognitive_score(self) -> float:
        max_points = 19
        if max_points <= 0:
            return 0.0
        raw = (self.points / max_points) * 100
        return round(max(0.0, min(100.0, raw)), 2)


# ─── DoctorAvailability (шаблон расписания) ───────────────────────────────────

class DoctorAvailability(Base):
    __tablename__ = "doctor_availabilities"

    id = Column(Integer, primary_key=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(SmallInteger, nullable=False)  # 1=Mon..7=Sun
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    type = Column(Enum(SlotType), default=SlotType.ONLINE, nullable=False)
    slot_duration_minutes = Column(SmallInteger, default=60)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor = relationship("User", back_populates="doctor_availabilities")

    __table_args__ = (
        Index("ix_doctor_avail_doc_day", "doctor_id", "day_of_week"),
    )


# ─── Availability (конкретные слоты с датой) ──────────────────────────────────

class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    type = Column(Enum('online', 'offline', name='slottype_avail'), nullable=False)
    available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    doctor = relationship("User", back_populates="availabilities", foreign_keys=[doctor_id])

    __table_args__ = (
        UniqueConstraint("doctor_id", "date", "start_time", "type", name="avail_unique"),
        Index("ix_avail_doctor_date", "doctor_id", "date"),
    )


# ─── Appointment ──────────────────────────────────────────────────────────────

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # legacy
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)

    # Основные поля
    date = Column(Date, nullable=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    type = Column(String(20), nullable=True)  # online / offline

    # Legacy поля (совместимость)
    appointment_date = Column(Date, nullable=True)
    appointment_time = Column(Time, nullable=True)
    format = Column(String(20), nullable=True)

    status = Column(
        Enum(AppointmentStatus),
        default=AppointmentStatus.CONFIRMED,
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patient = relationship("User", back_populates="appointments_as_patient", foreign_keys=[patient_id])
    doctor = relationship("User", back_populates="appointments_as_doctor", foreign_keys=[doctor_id])
    conclusion = relationship("Conclusion", back_populates="appointment", uselist=False)

    ACTIVE_STATUSES = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]

    @property
    def is_active(self) -> bool:
        return self.status in self.ACTIVE_STATUSES


# ─── Conclusion ───────────────────────────────────────────────────────────────

class Conclusion(Base):
    __tablename__ = "conclusions"

    id = Column(Integer, primary_key=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    complaints = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    diet_recommendations = Column(Text, nullable=True)
    examination_recommendations = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    appointment = relationship("Appointment", back_populates="conclusion")
    patient = relationship("User", back_populates="conclusions_as_patient", foreign_keys=[patient_id])
    doctor = relationship("User", back_populates="conclusions_as_doctor", foreign_keys=[doctor_id])


# ─── Analysis ─────────────────────────────────────────────────────────────────

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patient = relationship("User", back_populates="analyses", foreign_keys=[patient_id])


# ─── PreliminaryConclusion ────────────────────────────────────────────────────

class PreliminaryConclusion(Base):
    __tablename__ = "preliminary_conclusions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    test_id = Column(Integer, ForeignKey("tests.id", ondelete="SET NULL"), nullable=True, index=True)
    chronic_diseases = Column(Text, nullable=True)
    chronic_diseases_structured = Column(JSON, nullable=True)
    medication_allergies = Column(Text, nullable=True)
    medication_allergies_structured = Column(JSON, nullable=True)
    medical_history = Column(Text, nullable=True)
    medical_history_structured = Column(JSON, nullable=True)
    ai_summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="preliminary_conclusions")
    test = relationship("Test", back_populates="preliminary_conclusions")


# ─── AuditLog ─────────────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True)
    auditable_type = Column(String(100), nullable=True)
    auditable_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_user_created", "user_id", "created_at"),
        Index("ix_audit_event_created", "event_type", "created_at"),
        Index("ix_audit_created", "created_at"),
    )


# ─── News ─────────────────────────────────────────────────────────────────────

class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    author = relationship("User", foreign_keys=[author_id])


# ─── Memory (Дневник воспоминаний) ───────────────────────────────────────────

class Memory(Base):
    __tablename__ = "memories"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title      = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="memories")
