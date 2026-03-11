"""News endpoints"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc
from typing import Optional
import os, uuid, shutil

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.models import News
from app.core.config import settings

router = APIRouter(prefix="/news", tags=["News"])


def _out(n: News) -> dict:
    author_name = None
    if n.author:
        parts = [n.author.last_name, n.author.first_name]
        author_name = " ".join(p for p in parts if p) or None
    return {
        "id": n.id,
        "title": n.title,
        "content": n.content,
        "image_path": n.image_path,
        "is_published": n.is_published,
        "author_name": author_name,
        "created_at": str(n.created_at),
        "updated_at": str(n.updated_at),
    }


@router.get("")
async def list_news(page: int = 1, per_page: int = 10, db: AsyncSession = Depends(get_db)):
    offset = (page - 1) * per_page
    result = await db.execute(
        select(News).where(News.is_published == True)
        .order_by(News.created_at.desc()).offset(offset).limit(per_page)
    )
    news = result.scalars().all()
    total = (await db.execute(select(sqlfunc.count(News.id)).where(News.is_published == True))).scalar() or 0
    return {"news": [_out(n) for n in news], "total": total, "page": page, "per_page": per_page}


@router.get("/admin/all")
async def admin_list(db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    result = await db.execute(select(News).order_by(News.created_at.desc()))
    return [_out(n) for n in result.scalars().all()]


@router.get("/{news_id}")
async def get_one(news_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(News).where(News.id == news_id, News.is_published == True))
    n = result.scalar_one_or_none()
    if not n:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    return _out(n)


@router.post("")
async def create_news(
    title: str = Form(...), content: str = Form(...), is_published: bool = Form(True),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin),
):
    image_path = None
    if image and image.filename:
        ext = os.path.splitext(image.filename)[1].lower()
        filename = f"news_{uuid.uuid4().hex}{ext}"
        news_dir = os.path.join(settings.UPLOAD_DIR, "news")
        os.makedirs(news_dir, exist_ok=True)
        with open(os.path.join(news_dir, filename), "wb") as f:
            shutil.copyfileobj(image.file, f)
        image_path = f"news/{filename}"

    n = News(title=title, content=content, image_path=image_path, is_published=is_published, author_id=admin.id)
    db.add(n)
    await db.commit()
    await db.refresh(n)
    return _out(n)


@router.patch("/{news_id}")
async def update_news(
    news_id: int,
    title: Optional[str] = Form(None), content: Optional[str] = Form(None),
    is_published: Optional[bool] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin),
):
    result = await db.execute(select(News).where(News.id == news_id))
    n = result.scalar_one_or_none()
    if not n:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    if title is not None: n.title = title
    if content is not None: n.content = content
    if is_published is not None: n.is_published = is_published
    if image and image.filename:
        ext = os.path.splitext(image.filename)[1].lower()
        filename = f"news_{uuid.uuid4().hex}{ext}"
        news_dir = os.path.join(settings.UPLOAD_DIR, "news")
        os.makedirs(news_dir, exist_ok=True)
        with open(os.path.join(news_dir, filename), "wb") as f:
            shutil.copyfileobj(image.file, f)
        n.image_path = f"news/{filename}"
    await db.commit()
    await db.refresh(n)
    return _out(n)


@router.delete("/{news_id}")
async def delete_news(news_id: int, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    result = await db.execute(select(News).where(News.id == news_id))
    n = result.scalar_one_or_none()
    if not n:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    await db.delete(n)
    await db.commit()
    return {"ok": True}
