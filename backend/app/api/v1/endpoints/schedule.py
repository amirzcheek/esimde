from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_doctor
from app.models.user import User
from app.schemas.schemas import ScheduleSaveRequest, ScheduleResponse
from app.services import schedule_service

router = APIRouter(prefix="/schedule", tags=["Schedule"])


@router.get("", response_model=ScheduleResponse)
async def get_schedule(
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """Загрузить шаблон расписания врача."""
    schedule = await schedule_service.load_schedule(db, current_user.id)
    time_slots = schedule_service.generate_time_slots()
    return {
        "schedule": schedule,
        "time_slots": time_slots,
        "slot_duration": schedule_service.SLOT_DURATION_MINUTES,
    }


@router.post("", response_model=dict)
async def save_schedule(
    body: ScheduleSaveRequest,
    current_user: User = Depends(get_current_doctor),
    db: AsyncSession = Depends(get_db),
):
    """
    Сохранить шаблон расписания и развернуть реальные слоты на N недель.
    Это основной способ управления расписанием врача.
    """
    created = await schedule_service.save_schedule(
        db=db,
        doctor_id=current_user.id,
        schedule={int(k): v for k, v in body.schedule.items()},
        generate_weeks=body.generate_weeks,
    )
    return {
        "message": f"Расписание сохранено. Создано слотов: {created}",
        "slots_created": created,
        "weeks_generated": body.generate_weeks,
    }
