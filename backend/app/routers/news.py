from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/news", tags=["News"])


@router.get("", response_model=list[schemas.News])
async def read_news(db: AsyncSession = Depends(get_db)):
    return await crud.list_news(db)


@router.post("", response_model=schemas.News, status_code=status.HTTP_201_CREATED)
async def create_news(data: schemas.NewsCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_news(db, data)


@router.get("/{news_id}", response_model=schemas.News)
async def read_one(news_id: int, db: AsyncSession = Depends(get_db)):
    obj = await crud.get_news(db, news_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "News not found")
    return obj


@router.delete("/{news_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_one(news_id: int, db: AsyncSession = Depends(get_db)):
    obj = await crud.get_news(db, news_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "News not found")
    await crud.delete_news(db, obj)