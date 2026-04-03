import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.models import Appointment, AppointmentStatus, Payment, PaymentStatus
from app.core.paylink import create_payment_order, verify_webhook_signature, refund_payment

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])

# Стоимость приёма в тенге (временно фиксированная, потом — из профиля врача)
DEFAULT_PRICE_KZT = 15000


@router.post("/create/{appointment_id}")
async def create_payment(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Создаёт платёж для записи и возвращает ссылку на оплату PayLink."""

    # Проверяем что запись существует и принадлежит пользователю
    result = await db.execute(
        select(Appointment).where(
            Appointment.id == appointment_id,
            Appointment.patient_id == current_user.id,
        )
    )
    appointment = result.scalars().first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    # Проверяем что оплата ещё не создана
    existing = await db.execute(
        select(Payment).where(Payment.appointment_id == appointment_id)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Оплата для этой записи уже создана")

    # Генерируем уникальный order_id
    order_id = f"esimde-{appointment_id}-{uuid.uuid4().hex[:8]}"
    description = f"Консультация врача · {appointment.date} {appointment.start_time}"

    # Создаём заказ в PayLink
    try:
        paylink_data = await create_payment_order(
            order_id=order_id,
            amount_kzt=DEFAULT_PRICE_KZT,
            description=description,
            user_email=current_user.email,
        )
    except Exception as e:
        logger.error(f"PayLink create_order error: {e}")
        raise HTTPException(status_code=502, detail="Ошибка платёжного сервиса. Попробуйте позже.")

    # Сохраняем платёж в БД
    payment = Payment(
        appointment_id=appointment_id,
        user_id=current_user.id,
        paylink_order_id=paylink_data["order_id"],
        paylink_payment_url=paylink_data["payment_url"],
        amount=DEFAULT_PRICE_KZT,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)

    # Переводим запись в статус ожидания оплаты
    appointment.status = AppointmentStatus.AWAITING_PAYMENT
    await db.commit()

    return {
        "payment_url": paylink_data["payment_url"],
        "order_id": paylink_data["order_id"],
        "amount": DEFAULT_PRICE_KZT,
    }


@router.get("/status/{appointment_id}")
async def get_payment_status(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Возвращает статус оплаты для записи."""
    result = await db.execute(
        select(Payment).where(
            Payment.appointment_id == appointment_id,
            Payment.user_id == current_user.id,
        )
    )
    payment = result.scalars().first()
    if not payment:
        return {"status": "not_created"}
    return {
        "status": payment.status.value,
        "amount": payment.amount,
        "payment_url": payment.paylink_payment_url,
    }


@router.post("/webhook")
async def paylink_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Webhook от PayLink — вызывается при изменении статуса платежа.
    TODO: уточнить формат payload после получения документации.
    """
    payload = await request.body()
    signature = request.headers.get("X-PayLink-Signature", "")

    # Проверяем подпись (заглушка)
    if not await verify_webhook_signature(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")

    data = await request.json()
    order_id = data.get("order_id")
    status   = data.get("status")  # "success" / "failed" / "refunded"

    if not order_id or not status:
        raise HTTPException(status_code=400, detail="Invalid payload")

    # Находим платёж по order_id
    result = await db.execute(
        select(Payment).where(Payment.paylink_order_id == order_id)
    )
    payment = result.scalars().first()
    if not payment:
        logger.warning(f"PayLink webhook: payment not found for order_id={order_id}")
        return {"ok": True}

    # Обновляем статус платежа и записи
    if status == "success":
        payment.status = PaymentStatus.SUCCESS
        appt_result = await db.execute(
            select(Appointment).where(Appointment.id == payment.appointment_id)
        )
        appointment = appt_result.scalars().first()
        if appointment:
            appointment.status = AppointmentStatus.CONFIRMED

    elif status == "failed":
        payment.status = PaymentStatus.FAILED
        appt_result = await db.execute(
            select(Appointment).where(Appointment.id == payment.appointment_id)
        )
        appointment = appt_result.scalars().first()
        if appointment:
            appointment.status = AppointmentStatus.CANCELLED

    elif status == "refunded":
        payment.status = PaymentStatus.REFUNDED

    await db.commit()
    logger.info(f"PayLink webhook processed: order={order_id} status={status}")
    return {"ok": True}


@router.post("/refund/{appointment_id}")
async def refund(
    appointment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Возврат средств при отмене записи."""
    result = await db.execute(
        select(Payment).where(
            Payment.appointment_id == appointment_id,
            Payment.user_id == current_user.id,
            Payment.status == PaymentStatus.SUCCESS,
        )
    )
    payment = result.scalars().first()
    if not payment:
        raise HTTPException(status_code=404, detail="Оплаченный платёж не найден")

    success = await refund_payment(payment.paylink_order_id, payment.amount)
    if not success:
        raise HTTPException(status_code=502, detail="Ошибка возврата средств")

    payment.status = PaymentStatus.REFUNDED
    await db.commit()
    return {"ok": True, "message": "Возврат инициирован"}
