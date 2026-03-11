from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from uuid import UUID
import re

from app.core.database import get_db
from app.core.security import get_current_user, get_optional_user
from app.models.models import Test
from app.models.user import User
from app.schemas.schemas import TestResponse, TestAnswerRequest
from app.services import audit_service

router = APIRouter(prefix="/tests", tags=["Tests"])


def _normalize_phone(phone: str) -> Optional[str]:
    if not phone:
        return None
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    return digits or None


@router.post("/start", response_model=TestResponse, status_code=201)
async def start_test(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Создать новый тест. Работает для авторизованных и гостей."""
    test = Test(user_id=current_user.id if current_user else None)
    db.add(test)
    await db.commit()
    await db.refresh(test)
    return test


@router.post("/start-guest", response_model=TestResponse, status_code=201)
async def start_test_guest(db: AsyncSession = Depends(get_db)):
    """Создать тест для гостя (без авторизации)."""
    test = Test()
    db.add(test)
    await db.commit()
    await db.refresh(test)
    return test


@router.get("/{hash}", response_model=TestResponse)
async def get_test(hash: UUID, db: AsyncSession = Depends(get_db)):
    """Получить тест по hash."""
    result = await db.execute(select(Test).where(Test.hash == hash))
    test = result.scalar_one_or_none()
    if not test or test.deleted_at:
        raise HTTPException(status_code=404, detail="Тест не найден")
    return test


@router.post("/{hash}/answer", response_model=TestResponse)
async def save_answer(
    hash: UUID,
    body: TestAnswerRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Сохранить ответ на вопрос теста.
    Если гость указывает email/phone — создаём или находим пользователя и привязываем тест.
    Если next_question == 12 — тест завершён.
    """
    result = await db.execute(select(Test).where(Test.hash == hash))
    test = result.scalar_one_or_none()
    if not test or test.deleted_at:
        raise HTTPException(status_code=404, detail="Тест не найден")

    # Если гость регистрируется (вопрос 11 — финальный с данными)
    if not test.user_id and body.email:
        email = body.email.lower().strip()
        existing = await db.execute(select(User).where(User.email == email))
        user = existing.scalar_one_or_none()
        if not user:
            user = User(
                email=email,
                phone=_normalize_phone(body.phone) if body.phone else None,
                first_name=body.first_name or None,
                last_name=body.last_name or None,
                middle_name=body.middle_name or None,
            )
            db.add(user)
            await db.flush()
            await audit_service.log_register(db, user.id, request=request)
        elif body.first_name or body.last_name or body.middle_name:
            # Обновляем имя если не заполнено
            if body.first_name and not user.first_name:
                user.first_name = body.first_name
            if body.last_name and not user.last_name:
                user.last_name = body.last_name
            if body.middle_name and not user.middle_name:
                user.middle_name = body.middle_name
        test.user_id = user.id

    # Привязываем телефон если гость указал (без email)
    if not test.user_id and body.phone and not body.email:
        normalized = _normalize_phone(body.phone)
        if normalized:
            existing = await db.execute(select(User).where(User.phone == normalized))
            user = existing.scalar_one_or_none()
            if not user:
                user = User(
                    phone=normalized,
                    first_name=body.first_name or None,
                    last_name=body.last_name or None,
                    middle_name=body.middle_name or None,
                )
                db.add(user)
                await db.flush()
                await audit_service.log_register(db, user.id, request=request)
            test.user_id = user.id

    # Обновляем данные пользователя если авторизован и переданы ФИО
    if test.user_id and (body.first_name or body.last_name or body.middle_name):
        user_result = await db.execute(select(User).where(User.id == test.user_id))
        user = user_result.scalar_one_or_none()
        if user:
            if body.first_name:
                user.first_name = body.first_name
            if body.last_name:
                user.last_name = body.last_name
            if body.middle_name:
                user.middle_name = body.middle_name

    # Сохраняем ответ в payload
    import logging; logging.warning(f"[ANSWER] hash={hash} q={body.current_question} next={body.next_question} point={body.point}")
    payload = test.payload or {}
    payload[str(body.current_question)] = {
        "answer": body.answer,
        "point": body.point,
    }
    test.payload = payload

    # Завершение теста (next_question == 12 означает что пройдены все 11 вопросов)
    if body.next_question >= 12:
        from datetime import datetime, timezone
        from sqlalchemy import select as _select
        from app.models.user import User as _User
        test.completed_at = datetime.now(timezone.utc)
        await db.flush()

        # Генерируем предварительное заключение по шаблону
        if test.user_id:
            score = test.neurocognitive_score or 0
            if score >= 85:
                conclusion = (
                    f"По результатам нейрокогнитивного теста набрано {score:.1f}%. "
                    "Когнитивные функции в норме. Выраженных нарушений памяти, внимания и ориентации не выявлено. "
                    "Рекомендуется профилактическое наблюдение раз в год."
                )
            elif score >= 60:
                conclusion = (
                    f"По результатам нейрокогнитивного теста набрано {score:.1f}%. "
                    "Выявлены лёгкие когнитивные нарушения. Возможны незначительные снижения памяти и концентрации внимания. "
                    "Рекомендуется консультация невролога и повторное тестирование через 6 месяцев."
                )
            elif score >= 40:
                conclusion = (
                    f"По результатам нейрокогнитивного теста набрано {score:.1f}%. "
                    "Выявлены умеренные когнитивные нарушения. Отмечается снижение памяти, внимания и ориентации. "
                    "Настоятельно рекомендуется очная консультация невролога или психиатра."
                )
            else:
                conclusion = (
                    f"По результатам нейрокогнитивного теста набрано {score:.1f}%. "
                    "Выявлены выраженные когнитивные нарушения. Значительное снижение памяти, внимания и когнитивных функций. "
                    "Требуется срочная консультация специалиста и комплексное обследование."
                )
            _user_res = await db.execute(_select(_User).where(_User.id == test.user_id))
            _user = _user_res.scalar_one_or_none()
            if _user:
                _user.preliminary_conclusion = conclusion

        if test.user_id:
            await audit_service.log_test_complete(
                db, test.user_id, test.id, test.neurocognitive_score, request=request
            )

    await db.commit()
    await db.refresh(test)
    return test
