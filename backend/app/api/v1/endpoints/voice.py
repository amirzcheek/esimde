"""Voice Assistant endpoint — аналог VoiceAssistantController.php"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx, logging

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.schemas import VoiceStructureRequest, VoiceStructureResponse, VoiceSaveRequest

router = APIRouter(prefix="/voice", tags=["Voice Assistant"])
logger = logging.getLogger(__name__)


@router.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    lang: str = "ru",
    current_user: User = Depends(get_current_user),
):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    allowed = ["webm", "mp3", "wav", "m4a", "ogg"]
    ext = file.filename.split(".")[-1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Формат не поддерживается: {ext}")

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Файл слишком большой (макс 25 МБ)")

    if lang == "ru-RU":
        lang = "ru"

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                files={"file": (file.filename, content, file.content_type or "audio/webm")},
                data={"model": settings.OPENAI_WHISPER_MODEL, "language": lang},
            )

        if response.status_code == 200:
            return {"transcript": response.json().get("text", "")}

        status_code = response.status_code
        error = response.json().get("error", {})

        if status_code == 401:
            raise HTTPException(status_code=401, detail="Неверный OpenAI API ключ")
        if status_code == 429 or error.get("type") == "insufficient_quota":
            raise HTTPException(status_code=429, detail="Превышена квота OpenAI")

        logger.error(f"OpenAI Whisper error: {response.text}")
        raise HTTPException(status_code=502, detail="Ошибка сервиса транскрипции")

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Timeout при обращении к OpenAI")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/structure", response_model=VoiceStructureResponse)
async def structure(
    body: VoiceStructureRequest,
    current_user: User = Depends(get_current_user),
):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    answers = body.answers
    while len(answers) < 3:
        answers.append("")

    prompt = f"""Вы медицинский ассистент. Проанализируйте ответы пациента и извлеките структурированную информацию.

Вопрос 1 (Хронические заболевания): {answers[0]}
Вопрос 2 (Аллергия на медикаменты): {answers[1]}
Вопрос 3 (История болезни): {answers[2]}

Верните ТОЛЬКО JSON без дополнительного текста:
{{
  "chronic_diseases": "список хронических заболеваний",
  "medication_allergies": "список аллергий на медикаменты",
  "medical_history": "краткая история болезни",
  "entities": [
    {{"term": "термин", "type": "disease|symptom|medication|allergy|procedure", "normalized": "нормализованный термин"}}
  ]
}}"""

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.OPENAI_CHAT_MODEL,
                    "messages": [
                        {"role": "system", "content": "Вы медицинский ассистент. Отвечайте только в формате JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.3,
                    "response_format": {"type": "json_object"},
                },
            )

        if response.status_code == 200:
            import json
            content = response.json()["choices"][0]["message"]["content"]
            data = json.loads(content)
            return VoiceStructureResponse(
                chronic_diseases=data.get("chronic_diseases", ""),
                medication_allergies=data.get("medication_allergies", ""),
                medical_history=data.get("medical_history", ""),
                entities=data.get("entities", []),
            )

        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Неверный OpenAI API ключ")
        if response.status_code == 429:
            raise HTTPException(status_code=429, detail="Превышена квота OpenAI")

        logger.error(f"OpenAI Chat error: {response.text}")
        raise HTTPException(status_code=502, detail="Ошибка AI сервиса")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Structure exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save(
    body: VoiceSaveRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Проверяем что пациент — сам пользователь или доктор
    if body.patient_id != current_user.id and not current_user.is_doctor:
        raise HTTPException(status_code=403, detail="Нет доступа")

    result = await db.execute(select(User).where(User.id == body.patient_id))
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if body.chronic_diseases is not None:
        patient.chronic_diseases = body.chronic_diseases
    if body.medication_allergies is not None:
        patient.medication_allergies = body.medication_allergies
    if body.medical_history is not None:
        patient.medical_history = body.medical_history
    if body.preliminary_conclusion is not None:
        patient.preliminary_conclusion = body.preliminary_conclusion

    await db.commit()
    return {"success": True, "message": "Медицинские данные сохранены"}
