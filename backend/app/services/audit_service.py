from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import AuditLog
from fastapi import Request


async def log_event(
    db: AsyncSession,
    event_type: str,
    user_id: Optional[int] = None,
    description: Optional[str] = None,
    auditable_type: Optional[str] = None,
    auditable_id: Optional[int] = None,
    old_values: Optional[dict] = None,
    new_values: Optional[dict] = None,
    metadata: Optional[dict] = None,
    request: Optional[Request] = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        event_type=event_type,
        description=description,
        auditable_type=auditable_type,
        auditable_id=auditable_id,
        old_values=old_values,
        new_values=new_values,
        metadata_=metadata,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None,
        url=str(request.url) if request else None,
    )
    db.add(log)
    await db.flush()
    return log


async def log_login(db: AsyncSession, user_id: int, method: str = "otp", request: Request = None):
    await log_event(db, "login", user_id=user_id, description=f"Вход через {method}", request=request)


async def log_logout(db: AsyncSession, user_id: int, request: Request = None):
    await log_event(db, "logout", user_id=user_id, description="Выход из системы", request=request)


async def log_register(db: AsyncSession, user_id: int, request: Request = None):
    await log_event(db, "register", user_id=user_id, description="Регистрация нового пользователя", request=request)


async def log_test_complete(db: AsyncSession, user_id: int, test_id: int, score: float, request: Request = None):
    await log_event(
        db, "test_complete",
        user_id=user_id,
        description=f"Тест завершён. Счёт: {score}%",
        auditable_type="Test",
        auditable_id=test_id,
        metadata={"score": score},
        request=request,
    )


async def log_appointment_create(db: AsyncSession, user_id: int, appointment_id: int, request: Request = None):
    await log_event(
        db, "appointment_create",
        user_id=user_id,
        description="Создана запись на приём",
        auditable_type="Appointment",
        auditable_id=appointment_id,
        request=request,
    )


async def log_appointment_status(db: AsyncSession, user_id: int, appointment_id: int, old_status: str, new_status: str, request: Request = None):
    await log_event(
        db, "appointment_status_change",
        user_id=user_id,
        description=f"Статус записи изменён: {old_status} → {new_status}",
        auditable_type="Appointment",
        auditable_id=appointment_id,
        old_values={"status": old_status},
        new_values={"status": new_status},
        request=request,
    )


async def log_view_medical(db: AsyncSession, user_id: int, patient_id: int, context: str, request: Request = None):
    await log_event(
        db, "view_medical_info",
        user_id=user_id,
        description=f"Просмотр медицинских данных пациента #{patient_id} ({context})",
        auditable_type="User",
        auditable_id=patient_id,
        request=request,
    )


async def log_profile_update(db: AsyncSession, user_id: int, old_values: dict, new_values: dict, request: Request = None):
    await log_event(
        db, "profile_update",
        user_id=user_id,
        description="Обновление профиля",
        auditable_type="User",
        auditable_id=user_id,
        old_values=old_values,
        new_values=new_values,
        request=request,
    )
