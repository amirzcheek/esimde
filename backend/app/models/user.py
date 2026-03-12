from sqlalchemy import Column, Integer, String, Boolean, Date, Text, SmallInteger, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(120), nullable=True)
    last_name = Column(String(120), nullable=True)
    middle_name = Column(String(120), nullable=True)
    phone = Column(String(20), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=True, index=True)
    username = Column(String(100), unique=True, nullable=True)
    password = Column(String(255), nullable=True)
    photo = Column(String(500), nullable=True)
    avatar_path = Column(String(500), nullable=True)
    birth_date = Column(Date, nullable=True)
    height = Column(String(10), nullable=True)
    weight = Column(String(10), nullable=True)
    timezone = Column(String(50), default="Asia/Almaty")

    # Роли
    is_doctor = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)

    # Профиль врача
    city = Column(String(120), nullable=True)
    experience_years = Column(SmallInteger, default=0)
    position = Column(String(120), nullable=True)
    address = Column(Text, nullable=True)

    # Медицинские данные пациента
    medical_history = Column(Text, nullable=True)
    chronic_diseases = Column(Text, nullable=True)
    medication_allergies = Column(Text, nullable=True)
    preliminary_conclusion = Column(Text, nullable=True)

    remember_token = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tests = relationship("Test", back_populates="user", foreign_keys="Test.user_id")
    appointments_as_patient = relationship("Appointment", back_populates="patient", foreign_keys="Appointment.patient_id")
    appointments_as_doctor = relationship("Appointment", back_populates="doctor", foreign_keys="Appointment.doctor_id")
    availabilities = relationship("Availability", back_populates="doctor", foreign_keys="Availability.doctor_id")
    doctor_availabilities = relationship("DoctorAvailability", back_populates="doctor")
    analyses = relationship("Analysis", back_populates="patient", foreign_keys="Analysis.patient_id")
    conclusions_as_patient = relationship("Conclusion", back_populates="patient", foreign_keys="Conclusion.patient_id")
    memories = relationship("Memory", back_populates="user", cascade="all, delete-orphan")
    conclusions_as_doctor = relationship("Conclusion", back_populates="doctor", foreign_keys="Conclusion.doctor_id")
    preliminary_conclusions = relationship("PreliminaryConclusion", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

    @property
    def full_name(self) -> str:
        parts = [self.last_name, self.first_name, self.middle_name]
        return " ".join(p for p in parts if p) or f"Пользователь #{self.id}"

    @property
    def surname_initials(self) -> str:
        last = self.last_name or ""
        first_i = (self.first_name[0] + ".") if self.first_name else ""
        middle_i = (self.middle_name[0] + ".") if self.middle_name else ""
        return f"{last} {first_i}{middle_i}".strip()

    @property
    def normalized_phone(self) -> str | None:
        """Нормализует телефон: убирает не-цифры, заменяет ведущую 8 на 7"""
        if not self.phone:
            return None
        digits = "".join(c for c in self.phone if c.isdigit())
        if digits.startswith("8") and len(digits) == 11:
            digits = "7" + digits[1:]
        return digits
