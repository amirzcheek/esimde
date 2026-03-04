from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 дней

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://esimde:password@localhost:5432/esimde_db"

    # OTP
    DEV_AUTH_VISIBLE: bool = True
    OTP_EXPIRE_MINUTES: int = 5

    # SMS — Mobizon
    MOBIZON_API_KEY: str = ""
    MOBIZON_SENDER: str = ""

    # KazInfoteh WhatsApp
    KAZINFOTEH_API_KEY: str = ""
    KAZINFOTEH_BASE_URL: str = "https://api.kazinfoteh.org"
    KAZINFOTEH_TEMPLATE_ID: str = ""

    # Email SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@esimde.kz"

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_WHISPER_MODEL: str = "whisper-1"
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"

    # Files
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10

    # CORS — разрешаем фронт по умолчанию
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
    ]

    # Scheduler
    SLOT_GENERATE_WEEKS: int = 4

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
