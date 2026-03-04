from datetime import date, time, timedelta, datetime
from typing import Dict, List, Any, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_

from app.models.models import DoctorAvailability, Availability, SlotType
from app.core.config import settings


SLOT_DURATION_MINUTES = 60
TIME_SLOTS_START = 8
TIME_SLOTS_END = 19


def generate_time_slots(duration_minutes: int = SLOT_DURATION_MINUTES) -> List[str]:
    slots = []
    current = TIME_SLOTS_START * 60
    end = TIME_SLOTS_END * 60
    while current < end:
        h, m = divmod(current, 60)
        slots.append(f"{h:02d}:{m:02d}")
        current += duration_minutes
    return slots


def slot_end_time(start_label: str, duration_minutes: int = SLOT_DURATION_MINUTES) -> str:
    h, m = map(int, start_label.split(":"))
    total = h * 60 + m + duration_minutes
    eh, em = divmod(total, 60)
    return f"{eh:02d}:{em:02d}"


def _get_slot_enabled(slot_data: Any) -> bool:
    """Читает enabled из объекта или словаря."""
    if hasattr(slot_data, "enabled"):
        return slot_data.enabled
    if isinstance(slot_data, dict):
        return slot_data.get("enabled", False)
    return False


def _get_slot_type(slot_data: Any) -> str:
    """Читает type из объекта или словаря."""
    if hasattr(slot_data, "type"):
        return slot_data.type
    if isinstance(slot_data, dict):
        return slot_data.get("type", "both")
    return "both"


async def load_schedule(db: AsyncSession, doctor_id: int) -> Dict[int, Dict[str, Dict]]:
    time_slots = generate_time_slots()
    schedule: Dict[int, Dict[str, Dict]] = {}

    for dow in range(1, 8):
        schedule[dow] = {ts: {"enabled": False, "type": "both"} for ts in time_slots}

    result = await db.execute(
        select(DoctorAvailability).where(DoctorAvailability.doctor_id == doctor_id)
    )
    rows = result.scalars().all()

    for row in rows:
        start_str = row.start_time.strftime("%H:%M")
        end_str = row.end_time.strftime("%H:%M")
        for ts in time_slots:
            if start_str <= ts < end_str:
                schedule[row.day_of_week][ts] = {
                    "enabled": row.active,
                    "type": row.type.value,
                }

    return schedule


async def save_schedule(
    db: AsyncSession,
    doctor_id: int,
    schedule: Dict[int, Any],
    generate_weeks: int = None,
) -> int:
    if generate_weeks is None:
        generate_weeks = settings.SLOT_GENERATE_WEEKS

    # 1. Удаляем старый шаблон
    await db.execute(
        delete(DoctorAvailability).where(DoctorAvailability.doctor_id == doctor_id)
    )

    # 2. Сохраняем блоки из расписания
    time_slots = generate_time_slots()
    for dow in range(1, 8):
        day_schedule = schedule.get(dow, {})
        current_block = None

        for ts in time_slots:
            raw = day_schedule.get(ts, {"enabled": False, "type": "both"})
            enabled = _get_slot_enabled(raw)
            slot_type = _get_slot_type(raw)

            if enabled:
                if current_block is None:
                    current_block = {"start": ts, "end": slot_end_time(ts), "type": slot_type}
                elif current_block["type"] == slot_type:
                    current_block["end"] = slot_end_time(ts)
                else:
                    db.add(_make_availability_template(doctor_id, dow, current_block))
                    current_block = {"start": ts, "end": slot_end_time(ts), "type": slot_type}
            else:
                if current_block:
                    db.add(_make_availability_template(doctor_id, dow, current_block))
                    current_block = None

        if current_block:
            db.add(_make_availability_template(doctor_id, dow, current_block))

    await db.flush()

    # 3. Разворачиваем в реальные слоты
    created = await generate_availabilities_from_template(db, doctor_id, generate_weeks)
    await db.commit()
    return created


def _make_availability_template(doctor_id: int, dow: int, block: dict) -> DoctorAvailability:
    sh, sm = map(int, block["start"].split(":"))
    eh, em = map(int, block["end"].split(":"))
    return DoctorAvailability(
        doctor_id=doctor_id,
        day_of_week=dow,
        start_time=time(sh, sm),
        end_time=time(eh, em),
        type=SlotType(block["type"]),
        slot_duration_minutes=SLOT_DURATION_MINUTES,
        active=True,
    )


async def generate_availabilities_from_template(
    db: AsyncSession,
    doctor_id: int,
    weeks: int = None,
) -> int:
    if weeks is None:
        weeks = settings.SLOT_GENERATE_WEEKS

    today = date.today()

    await db.execute(
        delete(Availability).where(
            and_(
                Availability.doctor_id == doctor_id,
                Availability.date >= today,
                Availability.available == True,
            )
        )
    )

    result = await db.execute(
        select(DoctorAvailability).where(
            DoctorAvailability.doctor_id == doctor_id,
            DoctorAvailability.active == True,
        )
    )
    templates = result.scalars().all()
    if not templates:
        return 0

    time_slots = generate_time_slots()
    created = 0
    monday = today - timedelta(days=today.weekday())

    for week_offset in range(weeks):
        week_start = monday + timedelta(weeks=week_offset)

        for template in templates:
            slot_date = week_start + timedelta(days=template.day_of_week - 1)
            if slot_date < today:
                continue

            start_str = template.start_time.strftime("%H:%M")
            end_str = template.end_time.strftime("%H:%M")

            for ts in time_slots:
                if not (start_str <= ts < end_str):
                    continue

                ts_end = slot_end_time(ts)
                sh, sm = map(int, ts.split(":"))
                eh, em = map(int, ts_end.split(":"))

                slot_types = (
                    [SlotType.ONLINE, SlotType.OFFLINE]
                    if template.type == SlotType.BOTH
                    else [template.type]
                )

                for stype in slot_types:
                    exists = await db.execute(
                        select(Availability).where(
                            and_(
                                Availability.doctor_id == doctor_id,
                                Availability.date == slot_date,
                                Availability.start_time == time(sh, sm),
                                Availability.type == stype,
                            )
                        )
                    )
                    if exists.scalar_one_or_none():
                        continue

                    db.add(Availability(
                        doctor_id=doctor_id,
                        date=slot_date,
                        start_time=time(sh, sm),
                        end_time=time(eh, em),
                        type=stype,
                        available=True,
                    ))
                    created += 1

    await db.flush()
    return created
