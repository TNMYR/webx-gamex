from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, schemas, models
from app.database import get_db

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=list[schemas.Post])
async def read_posts(db: AsyncSession = Depends(get_db)):
    return await crud.list_posts(db)


@router.post("", response_model=schemas.Post, status_code=status.HTTP_201_CREATED)
async def create_post(data: schemas.PostCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_post(db, data)


@router.get("/{post_id}", response_model=schemas.Post)
async def read_post(post_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(models.Post, post_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    return obj


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    obj = await db.get(models.Post, post_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    await db.delete(obj)
    await db.commit()