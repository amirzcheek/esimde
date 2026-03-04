"""
Планировщик задач APScheduler.
Каждую неделю (понедельник в 01:00) автоматически продлевает слоты для всех врачей.
Это решает проблему из задачи: слоты создаются только на N недель вперёд при сохранении расписания.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
import logging

from app.core.database import AsyncSessionLocal
from app.models.models import DoctorAvailability
from app.services.schedule_service import generate_availabilities_from_template
from app.core.config import settings

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def extend_all_doctor_slots():
    """Продлить слоты для всех врачей у которых есть активный шаблон расписания."""
    logger.info("Scheduler: начинаем продление слотов врачей...")
    async with AsyncSessionLocal() as db:
        try:
            # Получаем уникальных врачей с активным шаблоном
            result = await db.execute(
                select(DoctorAvailability.doctor_id)
                .where(DoctorAvailability.active == True)
                .distinct()
            )
            doctor_ids = [r[0] for r in result.all()]

            total_created = 0
            for doctor_id in doctor_ids:
                created = await generate_availabilities_from_template(
                    db=db,
                    doctor_id=doctor_id,
                    weeks=settings.SLOT_GENERATE_WEEKS,
                )
                total_created += created

            await db.commit()
            logger.info(f"Scheduler: создано {total_created} слотов для {len(doctor_ids)} врачей")
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
            await db.rollback()


def start_scheduler():
    scheduler.add_job(
        extend_all_doctor_slots,
        trigger=CronTrigger(day_of_week="mon", hour=1, minute=0),  # Каждый понедельник в 01:00
        id="extend_doctor_slots",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — slot generation every Monday at 01:00")


def stop_scheduler():
    scheduler.shutdown()
