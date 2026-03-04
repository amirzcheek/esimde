from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, get_current_user
from app.schemas.schemas import (
    OTPSendRequest, OTPSendResponse, OTPVerifyRequest,
    TokenResponse, DoctorLoginRequest, UserShort
)
from app.services import auth_service, audit_service
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])


def _user_to_short(user: User) -> UserShort:
    from datetime import date
    age = None
    if user.birth_date:
        today = date.today()
        age = today.year - user.birth_date.year - (
            (today.month, today.day) < (user.birth_date.month, user.birth_date.day)
        )
    return UserShort(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        middle_name=user.middle_name,
        email=user.email,
        phone=user.normalized_phone,
        is_doctor=user.is_doctor,
        is_admin=user.is_admin,
        avatar_path=user.avatar_path,
        preliminary_conclusion=user.preliminary_conclusion,
        age=age,
        height=user.height,
        weight=user.weight,
    )


@router.post("/send-otp", response_model=OTPSendResponse)
async def send_otp(body: OTPSendRequest, request: Request, db: AsyncSession = Depends(get_db)):
    key, code = await auth_service.send_otp(phone=body.phone, email=body.email)
    response = OTPSendResponse(message="Код отправлен")
    if settings.DEV_AUTH_VISIBLE:
        response.dev_code = code
    return response


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(body: OTPVerifyRequest, request: Request, db: AsyncSession = Depends(get_db)):
    from app.services.auth_service import _otp_key, verify_otp as _verify

    key = _otp_key(phone=body.phone, email=body.email)
    if not _verify(key, body.code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Неверный или истёкший код")

    if body.phone:
        user = await auth_service.get_or_create_user_by_phone(db, body.phone)
        method = "phone_otp"
    else:
        user = await auth_service.get_or_create_user_by_email(db, body.email)
        method = "email_otp"

    token = create_access_token(user.id)
    await audit_service.log_login(db, user.id, method=method, request=request)
    await db.commit()
    await db.refresh(user)

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        is_doctor=user.is_doctor,
        is_admin=user.is_admin,
        profile_complete=bool(user.first_name and user.last_name),
        user=_user_to_short(user),
    )


@router.post("/login", response_model=TokenResponse)
async def doctor_login(body: DoctorLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth_service.doctor_login(db, body.username, body.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный логин или пароль")

    token = create_access_token(user.id)
    await audit_service.log_login(db, user.id, method="password", request=request)
    await db.commit()

    return TokenResponse(
        access_token=token,
        user_id=user.id,
        is_doctor=user.is_doctor,
        is_admin=user.is_admin,
        profile_complete=True,
        user=_user_to_short(user),
    )


@router.post("/logout")
async def logout(request: Request, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await audit_service.log_logout(db, current_user.id, request=request)
    await db.commit()
    return {"message": "Выход выполнен"}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    from datetime import date
    age = None
    if current_user.birth_date:
        today = date.today()
        age = today.year - current_user.birth_date.year - (
            (today.month, today.day) < (current_user.birth_date.month, current_user.birth_date.day)
        )
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "middle_name": current_user.middle_name,
        "phone": current_user.normalized_phone,
        "email": current_user.email,
        "is_doctor": current_user.is_doctor,
        "is_admin": current_user.is_admin,
        "profile_complete": bool(current_user.first_name and current_user.last_name),
        "avatar_path": current_user.avatar_path,
        "preliminary_conclusion": current_user.preliminary_conclusion,
        "age": age,
        "height": current_user.height,
        "weight": current_user.weight,
    }
