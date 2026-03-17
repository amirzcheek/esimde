from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import date, datetime, timezone, timedelta
from zoneinfo import ZoneInfo

KZ_TZ = ZoneInfo('Asia/Almaty')

from app.core.database import get_db
from app.core.security import get_current_user, get_current_doctor
from app.models.models import Appointment, Availability, Conclusion, AppointmentStatus
from app.models.user import User
from app.schemas.schemas import (
    AppointmentCreate, AppointmentResponse,
    AppointmentStatusUpdate,
)
from app.services import audit_service

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def _week_start(offset: int = 0) -> date:
    today = datetime.now(KZ_TZ).date()
    monday = today - timedelta(days=today.weekday())
    return monday + timedelta(weeks=offset)


def _appointment_to_dict(a: Appointment) -> dict:
    def _user_dict(u):
        if not u:
            return None
        return {
            "id": u.id,
            "full_name": u.full_name,
            "surname_initials": u.surname_initials,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "middle_name": u.middle_name,
            "phone": u.normalized_phone,
            "position": getattr(u, "position", None),
            "address": getattr(u, "address", None),
            "avatar_path": u.avatar_path,
        }

    def _conclusion_dict(c):
        if not c:
            return None
        return {
            "id": c.id,
            "complaints": c.complaints,
            "diagnosis": c.diagnosis,
            "medications": c.medications,
            "diet_recommendations": c.diet_recommendations,
            "examination_recommendations": c.examination_recommendations,
        }

    return {
        "id": a.id,
        "patient_id": a.patient_id,
        "doctor_id": a.doctor_id,
        "date": str(a.date) if a.date else None,
        "start_time": str(a.start_time)[:5] if a.start_time else None,
        "end_time": str(a.end_time)[:5] if a.end_time else None,
        "type": a.type,
        "status": a.status.value,
        "created_at": str(a.created_at),
        "doctor": _user_dict(a.doctor) if hasattr(a, "doctor") else None,
        "patient": _user_dict(a.patient) if hasattr(a, "patient") else None,
        "conclusion": _conclusion_dict(a.conclusion) if hasattr(a, "conclusion") else None,
    }


@router.get("/week-slots")
async def get_week_slots(
    doctor_id: int,
    week_offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    start = _week_start(week_offset)
    end = start + timedelta(days=6)
    today = datetime.now(KZ_TZ).date()
    now_time = datetime.now(KZ_TZ).time()

    result = await db.execute(
        select(Availability).where(
            and_(
                Availability.doctor_id == doctor_id,
                Availability.date >= start,
                Availability.date <= end,
                Availability.available == True,
            )
        )
    )
    avail_rows = result.scalars().all()

    avail_by_date: dict[date, list] = {}
    for row in avail_rows:
        avail_by_date.setdefault(row.date, []).append(row)

    days = []
    for i in range(7):
        d = start + timedelta(days=i)
        is_past = d < today
        has_slots = False
        if not is_past and d in avail_by_date:
            if d == today:
                has_slots = any(row.start_time >= now_time for row in avail_by_date[d])
            else:
                has_slots = True
        days.append({
            "date": d.isoformat(),
            "label": d.strftime("%a, %d.%m"),
            "has_slots": has_slots,
            "is_past": is_past,
        })

    return {"week_offset": week_offset, "days": days}


@router.get("/day-slots")
async def get_day_slots(
    doctor_id: int,
    slot_date: date,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = datetime.now(KZ_TZ).date()
    if slot_date < today:
        raise HTTPException(status_code=400, detail="Нельзя выбрать прошедшую дату")

    now_time = datetime.now(KZ_TZ).time()

    query = select(Availability).where(
        and_(
            Availability.doctor_id == doctor_id,
            Availability.date == slot_date,
            Availability.available == True,
        )
    )
    if slot_date == today:
        query = query.where(Availability.start_time >= now_time)

    result = await db.execute(query.order_by(Availability.start_time))
    slots = result.scalars().all()

    grouped: dict[str, dict] = {}
    for slot in slots:
        time_key = slot.start_time.strftime("%H:%M")
        if time_key not in grouped:
            grouped[time_key] = {
                "time": time_key,
                "end": slot.end_time.strftime("%H:%M"),
                "types": {},
            }
        grouped[time_key]["types"][slot.type] = slot.id

    return {"date": slot_date.isoformat(), "slots": list(grouped.values())}


@router.post("", status_code=201)
async def book_appointment(
    body: AppointmentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.patient_id == current_user.id,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="У вас уже есть активная запись. Отмените её перед созданием новой."
        )

    slot_result = await db.execute(
        select(Availability).where(Availability.id == body.slot_id).with_for_update()
    )
    slot = slot_result.scalar_one_or_none()
    if not slot or not slot.available:
        raise HTTPException(status_code=409, detail="Слот уже занят. Выберите другой.")

    now = datetime.now(KZ_TZ)
    slot_dt = datetime.combine(slot.date, slot.start_time).replace(tzinfo=KZ_TZ)
    if slot_dt < now:
        raise HTTPException(status_code=400, detail="Нельзя записаться на прошедшее время.")

    appointment = Appointment(
        user_id=current_user.id,
        patient_id=current_user.id,
        doctor_id=slot.doctor_id,
        date=slot.date,
        start_time=slot.start_time,
        end_time=slot.end_time,
        type=slot.type,
        appointment_date=slot.date,
        appointment_time=slot.start_time,
        format=slot.type,
        status=AppointmentStatus.CONFIRMED,
    )
    db.add(appointment)
    await db.flush()

    conclusion = Conclusion(
        appointment_id=appointment.id,
        patient_id=current_user.id,
        doctor_id=slot.doctor_id,
    )
    db.add(conclusion)
    slot.available = False

    await audit_service.log_appointment_create(db, current_user.id, appointment.id, request=request)
    await db.commit()
    await db.refresh(appointment)
    return {"id": appointment.id, "status": appointment.status.value, "message": "Запись создана"}


@router.get("/active")
async def get_active_appointment(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.doctor),
            selectinload(Appointment.patient),
            selectinload(Appointment.conclusion),
        )
        .where(
            and_(
                Appointment.patient_id == current_user.id,
                Appointment.status.in_([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
            )
        )
    )
    a = result.scalar_one_or_none()
    if not a:
        return None
    return _appointment_to_dict(a)


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.doctor),
            selectinload(Appointment.patient),
            selectinload(Appointment.conclusion),
        )
        .where(Appointment.id == appointment_id)
    )
    a = result.scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if a.patient_id != current_user.id and a.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    return _appointment_to_dict(a)


@router.delete("/{appointment_id}", status_code=204)
async def cancel_appointment(
    appointment_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id).with_for_update()
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if appointment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Нет доступа")
    if appointment.status not in [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="Запись уже завершена или отменена")

    old_status = appointment.status.value
    appointment.status = AppointmentStatus.CANCELLED

    slot_result = await db.execute(
        select(Availability).where(
            and_(
                Availability.doctor_id == appointment.doctor_id,
                Availability.date == appointment.date,
                Availability.start_time == appointment.start_time,
                Availability.type == appointment.type,
            )
        )
    )
    slot = slot_result.scalar_one_or_none()
    if slot:
        slot.available = True

    await audit_service.log_appointment_status(
        db, current_user.id, appointment_id, old_status, "cancelled", request=request
    )
    await db.commit()


@router.patch("/{appointment_id}/status")
async def update_appointment_status(
    appointment_id: int,
    body: AppointmentStatusUpdate,
    request: Request,
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id).with_for_update()
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Это не ваша запись")
    if appointment.status not in [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail="Нельзя изменить статус завершённой или отменённой записи")

    old_status = appointment.status.value
    appointment.status = body.status

    await audit_service.log_appointment_status(
        db, current_user.id, appointment_id, old_status, body.status.value, request=request
    )
    await db.commit()
    await db.refresh(appointment)
    return {"id": appointment.id, "status": appointment.status.value}


@router.get("/doctor/list")
async def doctor_appointments(
    status_filter: str = None,
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Appointment)
        .options(
            selectinload(Appointment.patient),
            selectinload(Appointment.conclusion),
        )
        .where(Appointment.doctor_id == current_user.id)
        .order_by(Appointment.date.desc(), Appointment.start_time.desc())
    )
    if status_filter:
        try:
            query = query.where(Appointment.status == AppointmentStatus(status_filter))
        except ValueError:
            pass

    result = await db.execute(query)
    appointments = result.scalars().all()
    return [_appointment_to_dict(a) for a in appointments]
