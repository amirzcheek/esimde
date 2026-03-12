import os, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.config import settings
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.models import Memory

router = APIRouter(prefix="/memories", tags=["memories"])


def _memory_out(m: Memory) -> dict:
    return {
        "id": m.id,
        "title": m.title,
        "description": m.description,
        "image_path": m.image_path,
        "created_at": str(m.created_at),
    }


@router.get("")
async def list_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Memory)
        .where(Memory.user_id == current_user.id)
        .order_by(Memory.created_at.desc())
    )
    return [_memory_out(m) for m in result.scalars().all()]


@router.get("/random")
async def random_memory(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Возвращает случайное воспоминание для показа на дашборде."""
    from sqlalchemy import func
    result = await db.execute(
        select(Memory)
        .where(Memory.user_id == current_user.id)
        .order_by(func.random())
        .limit(1)
    )
    m = result.scalars().first()
    if not m:
        return None
    return _memory_out(m)


@router.post("")
async def create_memory(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    image_path = None
    if image and image.filename:
        ext = os.path.splitext(image.filename)[1].lower()
        filename = f"{uuid.uuid4()}{ext}"
        folder = os.path.join(settings.UPLOAD_DIR, "memories")
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, filename)
        with open(path, "wb") as f:
            f.write(await image.read())
        image_path = f"memories/{filename}"

    memory = Memory(
        user_id=current_user.id,
        title=title,
        description=description,
        image_path=image_path,
    )
    db.add(memory)
    await db.commit()
    await db.refresh(memory)
    return _memory_out(memory)


@router.put("/{memory_id}")
async def update_memory(
    memory_id: int,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Memory).where(Memory.id == memory_id, Memory.user_id == current_user.id)
    )
    memory = result.scalars().first()
    if not memory:
        raise HTTPException(status_code=404, detail="Not found")

    memory.title = title
    memory.description = description

    if image and image.filename:
        ext = os.path.splitext(image.filename)[1].lower()
        filename = f"{uuid.uuid4()}{ext}"
        folder = os.path.join(settings.UPLOAD_DIR, "memories")
        os.makedirs(folder, exist_ok=True)
        path = os.path.join(folder, filename)
        with open(path, "wb") as f:
            f.write(await image.read())
        memory.image_path = f"memories/{filename}"

    await db.commit()
    await db.refresh(memory)
    return _memory_out(memory)


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Memory).where(Memory.id == memory_id, Memory.user_id == current_user.id)
    )
    memory = result.scalars().first()
    if not memory:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(memory)
    await db.commit()
    return {"ok": True}
