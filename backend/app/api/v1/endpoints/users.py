from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import date, datetime, timezone
import os, uuid, shutil

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user, get_current_doctor
from app.models.models import Appointment, Conclusion, Analysis, Test, AppointmentStatus
from app.models.user import User
from app.schemas.schemas import (
    UserProfileUpdate, DoctorProfileUpdate, ConclusionUpdate, ConclusionResponse,
    AnalysisResponse, PatientDashboardResponse
)
from app.services import audit_service

router = APIRouter(tags=["Users & Patients"])


def _calc_age(birth_date) -> Optional[int]:
    if not birth_date:
        return None
    today = date.today()
    return today.year - birth_date.year - (
        (today.month, today.day) < (birth_date.month, birth_date.day)
    )


# ─── Профиль текущего пользователя (dashboard) ───────────────────────────────

@router.get("/users/me/profile")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Полный профиль пациента для дашборда."""
    # Последний тест
    test_result = await db.execute(
        select(Test)
        .where(Test.user_id == current_user.id)
        .order_by(Test.created_at.desc())
    )
    last_test = test_result.scalars().first()

    # Последнее заключение с непустыми рекомендациями
    concl_result = await db.execute(
        select(Conclusion)
        .options(selectinload(Conclusion.appointment), selectinload(Conclusion.doctor))
        .where(
            and_(
                Conclusion.patient_id == current_user.id,
                (Conclusion.examination_recommendations != None) |
                (Conclusion.diet_recommendations != None) |
                (Conclusion.medications != None),
            )
        )
        .order_by(Conclusion.created_at.desc())
    )
    latest_conclusion = concl_result.scalars().first()

    # Ближайшая запись
    now_date = date.today()
    appt_result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.doctor))
        .where(
            and_(
                Appointment.patient_id == current_user.id,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
                Appointment.date >= now_date,
            )
        )
        .order_by(Appointment.date.asc(), Appointment.start_time.asc())
    )
    nearest_appointment = appt_result.scalars().first()

    def appointment_to_dict(a):
        if not a:
            return None
        doctor_dict = None
        if a.doctor:
            doctor_dict = {
                "id": a.doctor.id,
                "full_name": a.doctor.full_name,
                "position": a.doctor.position,
                "address": a.doctor.address,
                "phone": a.doctor.normalized_phone,
            }
        return {
            "id": a.id,
            "date": str(a.date),
            "start_time": str(a.start_time)[:5] if a.start_time else None,
            "end_time": str(a.end_time)[:5] if a.end_time else None,
            "type": a.type,
            "status": a.status.value,
            "doctor": doctor_dict,
        }

    def conclusion_to_dict(c):
        if not c:
            return None
        appt_date = None
        if c.appointment and c.appointment.date:
            appt_date = str(c.appointment.date)
        doctor_name = None
        if c.doctor:
            doctor_name = c.doctor.surname_initials
        return {
            "id": c.id,
            "appointment_id": c.appointment_id,
            "patient_id": c.patient_id,
            "doctor_id": c.doctor_id,
            "complaints": c.complaints,
            "diagnosis": c.diagnosis,
            "medications": c.medications,
            "diet_recommendations": c.diet_recommendations,
            "examination_recommendations": c.examination_recommendations,
            "created_at": str(c.created_at),
            "updated_at": str(c.updated_at),
            "appointment_date": appt_date,
            "doctor_name": doctor_name,
        }

    def test_to_dict(t):
        if not t:
            return None
        return {
            "id": t.id,
            "hash": str(t.hash),
            "user_id": t.user_id,
            "payload": t.payload,
            "points": t.points,
            "neurocognitive_score": t.neurocognitive_score,
            "completed_at": str(t.completed_at) if t.completed_at else None,
            "created_at": str(t.created_at),
        }

    age = _calc_age(current_user.birth_date)

    return {
        "user": {
            "id": current_user.id,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "middle_name": current_user.middle_name,
            "phone": current_user.normalized_phone,
            "email": current_user.email,
            "birth_date": str(current_user.birth_date) if current_user.birth_date else None,
            "age": age,
            "height": current_user.height,
            "weight": current_user.weight,
            "avatar_path": current_user.avatar_path,
            "city": current_user.city,
            "medical_history": current_user.medical_history,
            "chronic_diseases": current_user.chronic_diseases,
            "medication_allergies": current_user.medication_allergies,
            "preliminary_conclusion": current_user.preliminary_conclusion,
            "is_doctor": current_user.is_doctor,
            "is_admin": current_user.is_admin,
            "created_at": str(current_user.created_at),
        },
        "last_test": test_to_dict(last_test),
        "latest_conclusion": conclusion_to_dict(latest_conclusion),
        "nearest_appointment": appointment_to_dict(nearest_appointment),
    }




@router.patch("/patients/{patient_id}/preliminary-conclusion")
async def update_patient_preliminary_conclusion(
    patient_id: int,
    body: dict,
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select as sa_select
    result = await db.execute(sa_select(User).where(User.id == patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент не найден")
    patient.preliminary_conclusion = body.get("preliminary_conclusion", "")
    await db.commit()
    return {"ok": True}

@router.patch("/users/me", response_model=dict)
async def update_my_profile(
    body: UserProfileUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    old = {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "middle_name": current_user.middle_name,
        "birth_date": str(current_user.birth_date) if current_user.birth_date else None,
        "height": current_user.height,
        "weight": current_user.weight,
    }
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    new = {
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "middle_name": current_user.middle_name,
        "birth_date": str(current_user.birth_date) if current_user.birth_date else None,
        "height": current_user.height,
        "weight": current_user.weight,
    }
    await audit_service.log_profile_update(db, current_user.id, old, new, request=request)
    try:
        await db.commit()
        await db.refresh(current_user)
    except IntegrityError as e:
        await db.rollback()
        if "ix_users_phone" in str(e):
            raise HTTPException(status_code=400, detail="Этот номер телефона уже используется другим аккаунтом")
        if "ix_users_email" in str(e):
            raise HTTPException(status_code=400, detail="Этот email уже используется другим аккаунтом")
        raise HTTPException(status_code=400, detail="Ошибка сохранения данных")
    return {"message": "Профиль обновлён"}


@router.patch("/users/me/doctor-profile", response_model=dict)
async def update_doctor_profile(
    body: DoctorProfileUpdate,
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    await db.commit()
    return {"message": "Профиль врача обновлён"}


@router.post("/users/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "avatars"), exist_ok=True)
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        raise HTTPException(status_code=400, detail="Допустимы только изображения")
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, "avatars", filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    current_user.avatar_path = f"avatars/{filename}"
    await db.commit()
    return {"avatar_path": current_user.avatar_path}


# ─── Анализы пациента ─────────────────────────────────────────────────────────

@router.get("/analyses")
async def list_analyses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Analysis)
        .where(Analysis.patient_id == current_user.id)
        .order_by(Analysis.uploaded_at.desc())
    )
    items = result.scalars().all()
    return [
        {
            "id": a.id,
            "file_name": a.file_name,
            "file_path": a.file_path,
            "description": a.description,
            "uploaded_at": str(a.uploaded_at),
        }
        for a in items
    ]


@router.post("/analyses")
async def upload_analysis(
    file: UploadFile = File(...),
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    allowed_ext = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"Допустимые форматы: {', '.join(allowed_ext)}")

    # Ограничение размера (10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Файл не должен превышать 10 МБ")

    os.makedirs(os.path.join(settings.UPLOAD_DIR, "analyses"), exist_ok=True)
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(settings.UPLOAD_DIR, "analyses", filename)
    with open(path, "wb") as f:
        f.write(content)

    analysis = Analysis(
        patient_id=current_user.id,
        file_path=f"analyses/{filename}",
        file_name=file.filename,
        description=description,
        uploaded_at=datetime.now(timezone.utc),
    )
    db.add(analysis)
    await db.commit()
    await db.refresh(analysis)
    return {"id": analysis.id, "file_name": analysis.file_name, "message": "Файл загружен"}


@router.delete("/analyses/{analysis_id}", status_code=204)
async def delete_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Analysis).where(
            and_(Analysis.id == analysis_id, Analysis.patient_id == current_user.id)
        )
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        raise HTTPException(status_code=404, detail="Файл не найден")
    # Удаляем файл с диска
    full_path = os.path.join(settings.UPLOAD_DIR, analysis.file_path)
    if os.path.exists(full_path):
        os.remove(full_path)
    await db.delete(analysis)
    await db.commit()


# ─── Врачи (публичный список) ─────────────────────────────────────────────────

@router.get("/doctors")
async def list_doctors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.is_doctor == True).order_by(User.last_name)
    )
    doctors = result.scalars().all()
    return [
        {
            "id": d.id,
            "full_name": d.full_name,
            "first_name": d.first_name,
            "last_name": d.last_name,
            "position": d.position,
            "experience_years": d.experience_years,
            "avatar_path": d.avatar_path,
            "address": d.address,
            "phone": d.normalized_phone,
        }
        for d in doctors
    ]


# ─── Пациенты (только для врача) ──────────────────────────────────────────────

@router.get("/patients")
async def list_patients(
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment.patient_id)
        .where(Appointment.doctor_id == current_user.id)
        .distinct()
    )
    patient_ids = [r[0] for r in result.all() if r[0]]
    if not patient_ids:
        return []

    tests_result = await db.execute(
        select(Test).where(Test.user_id.in_(patient_ids)).order_by(Test.created_at.desc())
    )
    tests_by_user = {}
    for t in tests_result.scalars().all():
        if t.user_id not in tests_by_user:
            tests_by_user[t.user_id] = t

    patients_result = await db.execute(
        select(User)
        .where(User.id.in_(patient_ids), User.is_doctor == False)
        .order_by(User.last_name, User.first_name)
    )
    patients = patients_result.scalars().all()

    return [
        {
            "id": p.id,
            "name": p.full_name,
            "age": _calc_age(p.birth_date),
            "city": p.city,
            "phone": p.normalized_phone,
            "avatar_path": p.avatar_path,
            "last_test_score": tests_by_user[p.id].neurocognitive_score if p.id in tests_by_user else None,
        }
        for p in patients
    ]


@router.get("/patients/{patient_id}")
async def get_patient(
    patient_id: int,
    request: Request,
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    has_relation = await db.execute(
        select(Appointment).where(
            and_(Appointment.doctor_id == current_user.id, Appointment.patient_id == patient_id)
        )
    )
    if not has_relation.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="У вас нет доступа к этому пациенту")

    patient_result = await db.execute(select(User).where(User.id == patient_id))
    patient = patient_result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Пациент не найден")

    appointments_result = await db.execute(
        select(Appointment)
        .where(and_(Appointment.doctor_id == current_user.id, Appointment.patient_id == patient_id))
        .order_by(Appointment.date.desc())
    )
    appointments = appointments_result.scalars().all()

    conclusions_result = await db.execute(
        select(Conclusion)
        .options(selectinload(Conclusion.appointment))
        .where(and_(Conclusion.doctor_id == current_user.id, Conclusion.patient_id == patient_id))
        .order_by(Conclusion.created_at.desc())
    )
    conclusions = conclusions_result.scalars().all()

    analyses_result = await db.execute(
        select(Analysis).where(Analysis.patient_id == patient_id).order_by(Analysis.uploaded_at.desc())
    )
    analyses = analyses_result.scalars().all()

    test_result = await db.execute(
        select(Test).where(Test.user_id == patient_id).order_by(Test.created_at.desc())
    )
    last_test = test_result.scalars().first()

    await audit_service.log_view_medical(db, current_user.id, patient_id, "patient_details", request=request)
    await db.commit()

    return {
        "patient": {
            "id": patient.id,
            "full_name": patient.full_name,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "middle_name": patient.middle_name,
            "phone": patient.normalized_phone,
            "birth_date": str(patient.birth_date) if patient.birth_date else None,
            "age": _calc_age(patient.birth_date),
            "medical_history": patient.medical_history,
            "chronic_diseases": patient.chronic_diseases,
            "medication_allergies": patient.medication_allergies,
            "preliminary_conclusion": patient.preliminary_conclusion,
            "avatar_path": patient.avatar_path,
        },
        "appointments": [
            {
                "id": a.id, "date": str(a.date), "start_time": str(a.start_time)[:5] if a.start_time else None,
                "end_time": str(a.end_time)[:5] if a.end_time else None,
                "type": a.type, "status": a.status.value,
            }
            for a in appointments
        ],
        "conclusions": [
            {
                "id": c.id, "appointment_id": c.appointment_id,
                "complaints": c.complaints, "diagnosis": c.diagnosis,
                "medications": c.medications, "diet_recommendations": c.diet_recommendations,
                "examination_recommendations": c.examination_recommendations,
                "created_at": str(c.created_at),
                "appointment_date": str(c.appointment.date) if c.appointment else None,
            }
            for c in conclusions
        ],
        "analyses": [
            {"id": a.id, "file_name": a.file_name, "file_path": a.file_path, "description": a.description, "uploaded_at": str(a.uploaded_at)}
            for a in analyses
        ],
        "last_test": {
            "hash": str(last_test.hash),
            "score": last_test.neurocognitive_score,
            "points": last_test.points,
            "completed_at": str(last_test.completed_at) if last_test.completed_at else None,
        } if last_test else None,
    }


# ─── Заключения ───────────────────────────────────────────────────────────────

@router.get("/conclusions/patient")
async def get_patient_conclusions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Заключения текущего пациента."""
    result = await db.execute(
        select(Conclusion)
        .options(selectinload(Conclusion.appointment), selectinload(Conclusion.doctor))
        .where(Conclusion.patient_id == current_user.id)
        .order_by(Conclusion.created_at.desc())
    )
    conclusions = result.scalars().all()
    return [
        {
            "id": c.id,
            "appointment_id": c.appointment_id,
            "complaints": c.complaints,
            "diagnosis": c.diagnosis,
            "medications": c.medications,
            "diet_recommendations": c.diet_recommendations,
            "examination_recommendations": c.examination_recommendations,
            "created_at": str(c.created_at),
            "appointment_date": str(c.appointment.date) if c.appointment else None,
            "doctor_name": c.doctor.surname_initials if c.doctor else None,
        }
        for c in conclusions
    ]


@router.put("/conclusions/{conclusion_id}", response_model=ConclusionResponse)
async def update_conclusion(
    conclusion_id: int,
    body: ConclusionUpdate,
    request: Request,
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conclusion).where(Conclusion.id == conclusion_id))
    conclusion = result.scalar_one_or_none()
    if not conclusion:
        raise HTTPException(status_code=404, detail="Заключение не найдено")
    if conclusion.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")

    old = {f: getattr(conclusion, f) for f in body.model_fields}
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(conclusion, field, value)

    await audit_service.log_event(
        db, "conclusion_update", current_user.id,
        description=f"Обновление заключения #{conclusion_id}",
        auditable_type="Conclusion", auditable_id=conclusion_id,
        old_values=old, request=request,
    )
    await db.commit()
    await db.refresh(conclusion)
    return conclusion


# ─── Доктор: список приёмов сегодня ──────────────────────────────────────────

@router.get("/doctor/today-appointments")
async def doctor_today_appointments(
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    result = await db.execute(
        select(Appointment)
        .options(selectinload(Appointment.patient), selectinload(Appointment.conclusion))
        .where(
            and_(
                Appointment.doctor_id == current_user.id,
                Appointment.date == today,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            )
        )
        .order_by(Appointment.start_time.asc())
    )
    appointments = result.scalars().all()

    items = []
    for a in appointments:
        patient = a.patient
        last_test = None
        if patient:
            tr = await db.execute(
                select(Test).where(Test.user_id == patient.id).order_by(Test.created_at.desc())
            )
            last_test = tr.scalars().first()

        items.append({
            "id": a.id,
            "date": str(a.date),
            "start_time": str(a.start_time)[:5] if a.start_time else None,
            "end_time": str(a.end_time)[:5] if a.end_time else None,
            "type": a.type,
            "status": a.status.value,
            "patient": {
                "id": patient.id,
                "full_name": patient.full_name,
                "surname_initials": patient.surname_initials,
                "phone": patient.normalized_phone,
                "age": _calc_age(patient.birth_date),
                "last_test_score": last_test.neurocognitive_score if last_test else None,
            } if patient else None,
            "conclusion_id": a.conclusion.id if a.conclusion else None,
        })
    return items
