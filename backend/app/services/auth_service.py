import random
import re
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User

# In-memory OTP store: {key -> (code, expires_at)}
# В продакшне заменить на Redis
_otp_store: dict[str, tuple[str, datetime]] = {}


def _normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    return digits


def _otp_key(phone: str = None, email: str = None) -> str:
    if phone:
        return f"phone:{_normalize_phone(phone)}"
    return f"email:{email.lower()}"


def generate_otp() -> str:
    return str(random.randint(1000, 9999))


def store_otp(key: str, code: str) -> None:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    _otp_store[key] = (code, expires)


def verify_otp(key: str, code: str) -> bool:
    entry = _otp_store.get(key)
    if not entry:
        return False
    stored_code, expires = entry
    if datetime.now(timezone.utc) > expires:
        del _otp_store[key]
        return False
    if stored_code != code:
        return False
    del _otp_store[key]
    return True


async def send_sms_mobizon(phone: str, code: str) -> bool:
    """Отправка OTP через Mobizon SMS"""
    if not settings.MOBIZON_API_KEY:
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.mobizon.kz/service/Message/SendSmsMessage",
                data={
                    "apiKey": settings.MOBIZON_API_KEY,
                    "recipient": phone,
                    "text": f"eSIMDE: ваш код подтверждения: {code}",
                    "from": settings.MOBIZON_SENDER,
                },
            )
            return resp.status_code == 200
    except Exception:
        return False


async def send_whatsapp_kazinfoteh(phone: str, code: str) -> bool:
    """Отправка OTP через KazInfoteh WhatsApp"""
    if not settings.KAZINFOTEH_API_KEY:
        return False
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{settings.KAZINFOTEH_BASE_URL}/message/send",
                headers={"X-API-KEY": settings.KAZINFOTEH_API_KEY},
                json={
                    "phone": phone,
                    "template_id": settings.KAZINFOTEH_TEMPLATE_ID,
                    "params": {"code": code},
                },
            )
            if resp.status_code == 404:
                # Fallback с /wasender — оригинальная логика из Laravel
                resp = await client.post(
                    f"{settings.KAZINFOTEH_BASE_URL}/wasender/message/send",
                    headers={"X-API-KEY": settings.KAZINFOTEH_API_KEY},
                    json={"phone": phone, "template_id": settings.KAZINFOTEH_TEMPLATE_ID, "params": {"code": code}},
                )
            return resp.status_code == 200
    except Exception:
        return False


async def send_email_otp(email: str, code: str) -> bool:
    """Отправка OTP через email (SMTP)"""
    if not settings.SMTP_USER:
        return False
    try:
        msg = MIMEText(f"Ваш код подтверждения eSIMDE: {code}\n\nКод действителен {settings.OTP_EXPIRE_MINUTES} минут.")
        msg["Subject"] = "Код подтверждения eSIMDE"
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = email

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception:
        return False


async def send_otp(phone: str = None, email: str = None) -> tuple[str, str]:
    """
    Генерирует OTP, сохраняет в store, пытается отправить.
    Возвращает (key, code) — code нужен для DEV режима.
    """
    code = generate_otp()
    key = _otp_key(phone=phone, email=email)
    store_otp(key, code)

    if phone:
        normalized = _normalize_phone(phone)
        # Пробуем WhatsApp, затем SMS
        sent = await send_whatsapp_kazinfoteh(normalized, code)
        if not sent:
            await send_sms_mobizon(normalized, code)
    elif email:
        await send_email_otp(email, code)

    return key, code


async def get_or_create_user_by_phone(db: AsyncSession, phone: str) -> User:
    normalized = _normalize_phone(phone)
    result = await db.execute(select(User).where(User.phone == normalized))
    user = result.scalar_one_or_none()
    if not user:
        user = User(phone=normalized)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


async def get_or_create_user_by_email(db: AsyncSession, email: str) -> User:
    email = email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(email=email)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


async def doctor_login(db: AsyncSession, username: str, password: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.username == username, User.is_doctor == True))
    user = result.scalar_one_or_none()
    if not user or not user.password:
        return None
    if not verify_password(password, user.password):
        return None
    return user
