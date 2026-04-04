"""
PayLink payment gateway integration.
Документация: https://docs.paylink.kz/ru/integration/widget/setup_with_token/

Когда придут credentials — заполнить в .env:
  PAYLINK_SHOP_ID=...
  PAYLINK_SECRET_KEY=...
  PAYLINK_NOTIFICATION_URL=https://esimde.kz/api/v1/payments/webhook
"""
import os
import base64
import httpx
import logging

logger = logging.getLogger(__name__)

# ─── Конфиг ───────────────────────────────────────────────────────────────────
PAYLINK_SHOP_ID         = os.getenv("PAYLINK_SHOP_ID", "")          # TODO: заполнить
PAYLINK_SECRET_KEY      = os.getenv("PAYLINK_SECRET_KEY", "")       # TODO: заполнить
PAYLINK_CHECKOUT_URL    = "https://checkout.paylink.kz"
PAYLINK_TOKEN_URL       = "https://checkout.paylink.kz/ctp/api/checkouts"
PAYLINK_SUCCESS_URL     = os.getenv("PAYLINK_SUCCESS_URL", "https://esimde.kz/payment/success")
PAYLINK_FAIL_URL        = os.getenv("PAYLINK_FAIL_URL",    "https://esimde.kz/payment/fail")
PAYLINK_CANCEL_URL      = os.getenv("PAYLINK_CANCEL_URL",  "https://esimde.kz/payment/cancel")
PAYLINK_NOTIFICATION_URL = os.getenv("PAYLINK_NOTIFICATION_URL", "https://esimde.kz/api/v1/payments/webhook")
PAYLINK_TEST_MODE       = os.getenv("PAYLINK_TEST_MODE", "true").lower() == "true"


def _basic_auth() -> str:
    """Basic Auth: shop_id:secret_key в base64."""
    credentials = f"{PAYLINK_SHOP_ID}:{PAYLINK_SECRET_KEY}"
    return "Basic " + base64.b64encode(credentials.encode()).decode()


async def create_payment_token(
    order_id: str,
    amount_kzt: int,
    description: str,
    customer_email: str | None = None,
    customer_first_name: str | None = None,
    customer_last_name: str | None = None,
    customer_phone: str | None = None,
) -> dict:
    """
    Создаёт токен платежа в PayLink.
    Возвращает {"token": str, "redirect_url": str}
    """

    # ── ЗАГЛУШКА если credentials не заданы ──────────────────────────────────
    if not PAYLINK_SHOP_ID or not PAYLINK_SECRET_KEY:
        logger.warning("PayLink: PAYLINK_SHOP_ID/PAYLINK_SECRET_KEY not configured — using STUB")
        stub_token = f"stub_token_{order_id}"
        return {
            "token": stub_token,
            "redirect_url": f"{PAYLINK_CHECKOUT_URL}/v2/checkout?token={stub_token}",
        }
    # ─────────────────────────────────────────────────────────────────────────

    payload = {
        "checkout": {
            "test": PAYLINK_TEST_MODE,
            "transaction_type": "payment",
            "attempts": 3,
            "iframe": True,
            "settings": {
                "success_url":      PAYLINK_SUCCESS_URL,
                "fail_url":         PAYLINK_FAIL_URL,
                "cancel_url":       PAYLINK_CANCEL_URL,
                "notification_url": PAYLINK_NOTIFICATION_URL,
                "language":         "ru",
                "auto_return":      3,
                "button_next_text": "Вернуться в esimde",
            },
            "order": {
                "currency":    "KZT",
                "amount":      amount_kzt * 100,   # в тиынах
                "description": description,
                "tracking_id": order_id,
            },
        }
    }

    # Добавляем данные покупателя если есть
    customer: dict = {}
    if customer_email:      customer["email"]      = customer_email
    if customer_first_name: customer["first_name"] = customer_first_name
    if customer_last_name:  customer["last_name"]  = customer_last_name
    if customer_phone:      customer["phone"]      = customer_phone
    if customer:
        payload["checkout"]["customer"] = customer

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            PAYLINK_TOKEN_URL,
            json=payload,
            headers={
                "Content-Type":  "application/json",
                "Accept":        "application/json",
                "X-API-Version": "2",
                "Authorization": _basic_auth(),
            },
        )
        resp.raise_for_status()
        data = resp.json()

    token       = data["checkout"]["token"]
    redirect_url = data["checkout"]["redirect_url"]
    logger.info(f"PayLink token created: order_id={order_id} token={token[:10]}...")
    return {"token": token, "redirect_url": redirect_url}


async def verify_webhook(payload: bytes, signature: str) -> bool:
    """
    Проверяет подпись webhook от PayLink.
    TODO: уточнить алгоритм подписи в документации PayLink.

    import hmac, hashlib
    expected = hmac.new(PAYLINK_SECRET_KEY.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
    """
    if not PAYLINK_SECRET_KEY:
        logger.warning("PayLink: webhook signature verification STUB (no secret key)")
        return True
    # TODO: реализовать после уточнения алгоритма подписи
    return True


async def refund_payment(paylink_order_id: str, amount_kzt: int) -> bool:
    """
    Возврат средств через PayLink.
    TODO: реализовать после получения документации по возвратам.
    Endpoint: POST https://checkout.paylink.kz/ctp/api/checkouts/{token}/refunds
    """
    logger.warning(f"PayLink: refund STUB for order={paylink_order_id}")
    return True
