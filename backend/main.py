from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import logging
import logging.handlers
import time

from app.core.config import settings
from app.core.scheduler import start_scheduler, stop_scheduler
from app.api.v1.endpoints import auth, appointments, users, tests, schedule, voice, admin, news, memories, payments


def setup_logging():
    """Настройка логирования: консоль + ротируемый файл."""
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root = logging.getLogger()
    root.setLevel(logging.INFO)

    # Консоль
    console = logging.StreamHandler()
    console.setFormatter(fmt)
    root.addHandler(console)

    # Файл — app.log, ротация 10 МБ, хранить 7 файлов
    file_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(log_dir, "app.log"),
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=7,
        encoding="utf-8",
    )
    file_handler.setFormatter(fmt)
    root.addHandler(file_handler)

    # Отдельный файл для ошибок — error.log
    error_handler = logging.handlers.RotatingFileHandler(
        filename=os.path.join(log_dir, "error.log"),
        maxBytes=5 * 1024 * 1024,   # 5 MB
        backupCount=5,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(fmt)
    root.addHandler(error_handler)

    # Приглушаем шумные библиотеки
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "avatars"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "analyses"), exist_ok=True)
    start_scheduler()
    logger.info("eSIMDE API started")
    yield
    stop_scheduler()
    logger.info("eSIMDE API stopped")


app = FastAPI(
    title="eSIMDE API",
    description="Платформа ранней диагностики Альцгеймера",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── HTTP Access Logger ───────────────────────────────────────────────────────
access_logger = logging.getLogger("esimde.access")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.monotonic()
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.exception("Unhandled error: %s %s", request.method, request.url.path)
        raise
    duration_ms = (time.monotonic() - start) * 1000
    # Не логируем health-check и статику чтобы не засорять лог
    if not request.url.path.startswith(("/uploads", "/health")):
        level = logging.WARNING if response.status_code >= 400 else logging.INFO
        access_logger.log(
            level,
            "%s %s %d %.1fms | ip=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            request.client.host if request.client else "-",
        )
    return response

# Статика
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Роутеры
PREFIX = "/api/v1"
app.include_router(auth.router,         prefix=PREFIX)
app.include_router(appointments.router, prefix=PREFIX)
app.include_router(users.router,        prefix=PREFIX)
app.include_router(tests.router,        prefix=PREFIX)
app.include_router(schedule.router,     prefix=PREFIX)
app.include_router(voice.router,        prefix=PREFIX)
app.include_router(admin.router,        prefix=PREFIX)
app.include_router(news.router,         prefix=PREFIX)
app.include_router(memories.router,     prefix=PREFIX)
app.include_router(payments.router,     prefix=PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
