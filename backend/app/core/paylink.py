"""
PayLink payment gateway integration (скелет).
Когда придут credentials — заполнить PAYLINK_CLIENT_ID и PAYLINK_CLIENT_SECRET
в .env и раскомментировать реальные запросы.
"""
import os
import httpx
import logging

logger = logging.getLogger(__name__)

# ─── Конфиг (заполнить после получения credentials) ───────────────────────────
PAYLINK_CLIENT_ID     = os.getenv("PAYLINK_CLIENT_ID", "")       # TODO: заполнить
PAYLINK_CLIENT_SECRET = os.getenv("PAYLINK_CLIENT_SECRET", "")   # TODO: заполнить
PAYLINK_BASE_URL      = os.getenv("PAYLINK_BASE_URL", "https://api.paylink.kz")  # уточнить URL
PAYLINK_SUCCESS_URL   = os.getenv("PAYLINK_SUCCESS_URL", "https://esimde.kz/payment/success")
PAYLINK_FAIL_URL      = os.getenv("PAYLINK_FAIL_URL",    "https://esimde.kz/payment/fail")
PAYLINK_WEBHOOK_SECRET = os.getenv("PAYLINK_WEBHOOK_SECRET", "")  # TODO: заполнить


async def create_payment_order(
    order_id: str,
    amount_kzt: int,
    description: str,
    user_email: str | None = None,
) -> dict:
    """
    Создаёт заказ на оплату в PayLink.
    Возвращает {"payment_url": str, "order_id": str}

    TODO: когда придут credentials — заменить заглушку на реальный запрос:

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYLINK_BASE_URL}/orders",
            json={
                "client_id":     PAYLINK_CLIENT_ID,
                "client_secret": PAYLINK_CLIENT_SECRET,
                "order_id":      order_id,
                "amount":        amount_kzt * 100,   # в тиынах
                "currency":      "KZT",
                "description":   description,
                "success_url":   PAYLINK_SUCCESS_URL,
                "fail_url":      PAYLINK_FAIL_URL,
                "email":         user_email,
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return {"payment_url": data["payment_url"], "order_id": data["order_id"]}
    """
    # ── ЗАГЛУШКА (удалить после подключения реального API) ──────────────────
    logger.warning("PayLink: using STUB — credentials not configured")
    stub_url = f"https://pay.paylink.kz/stub?order={order_id}&amount={amount_kzt}"
    return {"payment_url": stub_url, "order_id": order_id}
    # ────────────────────────────────────────────────────────────────────────


async def verify_webhook_signature(payload: bytes, signature: str) -> bool:
    """
    Проверяет подпись webhook от PayLink.

    TODO: реализовать после получения документации по подписи:

    import hmac, hashlib
    expected = hmac.new(
        PAYLINK_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
    """
    # ── ЗАГЛУШКА ─────────────────────────────────────────────────────────────
    logger.warning("PayLink: webhook signature verification is STUB")
    return True
    # ────────────────────────────────────────────────────────────────────────


async def refund_payment(paylink_order_id: str, amount_kzt: int) -> bool:
    """
    Возврат средств через PayLink.

    TODO: реализовать после получения документации:

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYLINK_BASE_URL}/refunds",
            json={
                "client_id":     PAYLINK_CLIENT_ID,
                "client_secret": PAYLINK_CLIENT_SECRET,
                "order_id":      paylink_order_id,
                "amount":        amount_kzt * 100,
            },
            timeout=10,
        )
        return resp.status_code == 200
    """
    logger.warning("PayLink: refund is STUB")
    return True
