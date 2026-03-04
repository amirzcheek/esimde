"""Admin & Audit endpoints — аналог AdminController.php + AuditAnalytics.php"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import Optional
from datetime import datetime, date

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import AuditLog
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin and not current_user.is_doctor:
        raise HTTPException(status_code=403, detail="Доступ только для администраторов")
    return current_user


@router.get("/audit-logs")
async def get_audit_logs(
    page: int = 1,
    per_page: int = 50,
    event_type: Optional[str] = None,
    user_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditLog).order_by(AuditLog.created_at.desc())

    if event_type:
        query = query.where(AuditLog.event_type == event_type)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if start_date:
        query = query.where(AuditLog.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.where(AuditLog.created_at <= datetime.combine(end_date, datetime.max.time()))

    # Пагинация
    offset = (page - 1) * per_page
    result = await db.execute(query.offset(offset).limit(per_page))
    logs = result.scalars().all()

    # Получаем пользователей
    user_ids = list({l.user_id for l in logs if l.user_id})
    users_map = {}
    if user_ids:
        users_result = await db.execute(select(User).where(User.id.in_(user_ids)))
        for u in users_result.scalars().all():
            users_map[u.id] = u

    return {
        "logs": [
            {
                "id": l.id,
                "user_id": l.user_id,
                "user_name": users_map[l.user_id].full_name if l.user_id in users_map else None,
                "event_type": l.event_type,
                "description": l.description,
                "ip_address": l.ip_address,
                "metadata": l.metadata_,
                "created_at": str(l.created_at),
            }
            for l in logs
        ],
        "page": page,
        "per_page": per_page,
    }


@router.get("/stats")
async def get_stats(
    current_user: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    # Статистика по типам событий
    event_types_result = await db.execute(
        select(AuditLog.event_type, func.count(AuditLog.id).label("count"))
        .group_by(AuditLog.event_type)
        .order_by(func.count(AuditLog.id).desc())
    )
    event_types = {row.event_type: row.count for row in event_types_result.all()}

    # Статистика аутентификации
    auth_result = await db.execute(
        select(AuditLog.event_type, func.count(AuditLog.id).label("count"))
        .where(AuditLog.event_type.in_(["login", "login_failed", "logout"]))
        .group_by(AuditLog.event_type)
    )
    auth_map = {row.event_type: row.count for row in auth_result.all()}

    # Тесты
    tests_result = await db.execute(
        select(func.count(AuditLog.id))
        .where(AuditLog.event_type == "test_complete")
    )
    test_count = tests_result.scalar() or 0

    # Активные пользователи
    active_result = await db.execute(
        select(AuditLog.user_id, func.count(AuditLog.id).label("activity"))
        .where(AuditLog.user_id != None)
        .group_by(AuditLog.user_id)
        .order_by(func.count(AuditLog.id).desc())
        .limit(10)
    )
    active_users = []
    for row in active_result.all():
        u = await db.execute(select(User).where(User.id == row.user_id))
        user = u.scalar_one_or_none()
        active_users.append({
            "user_id": row.user_id,
            "name": user.full_name if user else f"User#{row.user_id}",
            "activity_count": row.activity,
        })

    return {
        "event_types": event_types,
        "auth_stats": {
            "total_logins": auth_map.get("login", 0),
            "failed_logins": auth_map.get("login_failed", 0),
            "logouts": auth_map.get("logout", 0),
        },
        "test_stats": {
            "total_completions": test_count,
        },
        "most_active_users": active_users,
    }


@router.get("/users")
async def list_all_users(
    page: int = 1,
    per_page: int = 50,
    search: Optional[str] = None,
    role: Optional[str] = None,  # "patient" | "doctor" | None
    current_user: User = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Список всех пользователей для админа."""
    from sqlalchemy import or_, cast, String
    query = select(User).order_by(User.created_at.desc())

    if search:
        like = f"%{search}%"
        query = query.where(or_(
            User.first_name.ilike(like),
            User.last_name.ilike(like),
            User.email.ilike(like),
            User.phone.ilike(like),
        ))
    if role == "doctor":
        query = query.where(User.is_doctor == True)
    elif role == "patient":
        query = query.where(User.is_doctor == False)

    offset = (page - 1) * per_page
    result = await db.execute(query.offset(offset).limit(per_page))
    users = result.scalars().all()

    return [
        {
            "id": u.id,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "middle_name": u.middle_name,
            "email": u.email,
            "phone": u.phone,
            "is_doctor": u.is_doctor,
            "is_admin": u.is_admin,
            "created_at": str(u.created_at),
        }
        for u in users
    ]
