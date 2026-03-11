from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional, List, Dict, Any
from datetime import date, time, datetime
from uuid import UUID
from app.models.models import AppointmentStatus, SlotType
import re


# ─── Auth ─────────────────────────────────────────────────────────────────────

class OTPSendRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

    @model_validator(mode="after")
    def phone_or_email(self):
        if not self.phone and not self.email:
            raise ValueError("Укажите телефон или email")
        return self


class OTPVerifyRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    code: str

    @model_validator(mode="after")
    def phone_or_email(self):
        if not self.phone and not self.email:
            raise ValueError("Укажите телефон или email")
        return self


class DoctorLoginRequest(BaseModel):
    username: str
    password: str


class UserShort(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_doctor: bool = False
    is_admin: bool = False
    avatar_path: Optional[str] = None
    preliminary_conclusion: Optional[str] = None
    age: Optional[int] = None
    height: Optional[str] = None
    weight: Optional[str] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    is_doctor: bool
    is_admin: bool
    profile_complete: bool
    user: Optional[UserShort] = None


class OTPSendResponse(BaseModel):
    message: str
    dev_code: Optional[str] = None


# ─── User ─────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    birth_date: Optional[date] = None
    height: Optional[str] = None
    weight: Optional[str] = None


class UserProfileUpdate(UserBase):
    phone: Optional[str] = None
    city: Optional[str] = None
    chronic_diseases: Optional[str] = None
    medication_allergies: Optional[str] = None
    medical_history: Optional[str] = None


class DoctorProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    city: Optional[str] = None
    experience_years: Optional[int] = None
    position: Optional[str] = None
    address: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    birth_date: Optional[date] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    is_doctor: bool = False
    is_admin: bool = False
    city: Optional[str] = None
    experience_years: Optional[int] = None
    position: Optional[str] = None
    avatar_path: Optional[str] = None
    address: Optional[str] = None
    medical_history: Optional[str] = None
    chronic_diseases: Optional[str] = None
    medication_allergies: Optional[str] = None
    preliminary_conclusion: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DoctorListItem(BaseModel):
    id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: str = ""
    position: Optional[str] = None
    experience_years: Optional[int] = None
    avatar_path: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Test ─────────────────────────────────────────────────────────────────────

class TestResponse(BaseModel):
    id: int
    hash: UUID
    user_id: Optional[int] = None
    payload: Optional[Dict[str, Any]] = None
    points: float
    neurocognitive_score: float
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TestAnswerRequest(BaseModel):
    current_question: int
    answer: str
    point: float
    next_question: int
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None


# ─── Availability / Schedule ──────────────────────────────────────────────────

class SlotResponse(BaseModel):
    id: int
    date: date
    start_time: time
    end_time: time
    type: str
    available: bool

    model_config = {"from_attributes": True}


class DaySlots(BaseModel):
    date: str
    label: str
    has_slots: bool
    is_past: bool


class WeekSlotsResponse(BaseModel):
    week_offset: int
    days: List[DaySlots]


class DaySlotDetail(BaseModel):
    time: str
    end: str
    types: Dict[str, int]


class ScheduleSlotConfig(BaseModel):
    enabled: bool
    type: str = "both"


class ScheduleSaveRequest(BaseModel):
    schedule: Dict[int, Dict[str, ScheduleSlotConfig]]
    generate_weeks: int = 4


class ScheduleResponse(BaseModel):
    schedule: Dict[int, Dict[str, ScheduleSlotConfig]]
    time_slots: List[str]
    slot_duration: int


# ─── Appointment ──────────────────────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    slot_id: int


class AppointmentResponse(BaseModel):
    id: int
    patient_id: Optional[int] = None
    doctor_id: Optional[int] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    type: Optional[str] = None
    status: AppointmentStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class AppointmentDetailResponse(AppointmentResponse):
    patient: Optional[Dict[str, Any]] = None
    doctor: Optional[Dict[str, Any]] = None
    conclusion: Optional[Dict[str, Any]] = None


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus

    @field_validator("status")
    @classmethod
    def valid_transition(cls, v):
        allowed = [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW, AppointmentStatus.CANCELLED]
        if v not in allowed:
            raise ValueError(f"Можно установить только: {[s.value for s in allowed]}")
        return v


# ─── Conclusion ───────────────────────────────────────────────────────────────

class ConclusionUpdate(BaseModel):
    complaints: Optional[str] = None
    diagnosis: Optional[str] = None
    medications: Optional[str] = None
    diet_recommendations: Optional[str] = None
    examination_recommendations: Optional[str] = None


class ConclusionResponse(BaseModel):
    id: int
    appointment_id: int
    patient_id: int
    doctor_id: int
    complaints: Optional[str] = None
    diagnosis: Optional[str] = None
    medications: Optional[str] = None
    diet_recommendations: Optional[str] = None
    examination_recommendations: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Analysis ─────────────────────────────────────────────────────────────────

class AnalysisResponse(BaseModel):
    id: int
    patient_id: int
    file_path: str
    file_name: str
    description: Optional[str] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}


# ─── Patient (для врача) ──────────────────────────────────────────────────────

class PatientListItem(BaseModel):
    id: int
    name: str
    age: Optional[int] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    avatar_path: Optional[str] = None
    last_test_score: Optional[float] = None

    model_config = {"from_attributes": True}


# ─── Voice Assistant ──────────────────────────────────────────────────────────

class VoiceStructureRequest(BaseModel):
    answers: List[str]


class VoiceStructureResponse(BaseModel):
    chronic_diseases: str = ""
    medication_allergies: str = ""
    medical_history: str = ""
    entities: List[Dict[str, str]] = []


class VoiceSaveRequest(BaseModel):
    patient_id: int
    chronic_diseases: Optional[str] = None
    medication_allergies: Optional[str] = None
    medical_history: Optional[str] = None
    preliminary_conclusion: Optional[str] = None
    entities: Optional[List[Dict[str, str]]] = None


# ─── Audit ────────────────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    event_type: str
    description: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuditStatsResponse(BaseModel):
    test_stats: Dict[str, Any]
    auth_stats: Dict[str, Any]
    event_types: Dict[str, int]
    most_active_users: List[Dict[str, Any]]


# ─── Dashboard (пациент) ──────────────────────────────────────────────────────

class PatientDashboardResponse(BaseModel):
    user: UserResponse
    last_test: Optional[TestResponse] = None
    latest_conclusion: Optional[ConclusionResponse] = None
    nearest_appointment: Optional[AppointmentResponse] = None
