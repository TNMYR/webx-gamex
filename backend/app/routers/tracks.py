from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/tracks", tags=["Tracks"])


@router.get("", response_model=list[schemas.Track])
async def read_tracks(db: AsyncSession = Depends(get_db)):
    return await crud.list_tracks(db)


@router.post("", response_model=schemas.Track, status_code=status.HTTP_201_CREATED)
async def create_track(data: schemas.TrackCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_track(db, data)


@router.get("/{track_id}", response_model=schemas.Track)
async def read_track(track_id: int, db: AsyncSession = Depends(get_db)):
    obj = await crud.get_track(db, track_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Track not found")
    return obj


@router.patch("/{track_id}", response_model=schemas.Track)
async def update_track(track_id: int, data: schemas.TrackUpdate, db: AsyncSession = Depends(get_db)):
    obj = await crud.get_track(db, track_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Track not found")
    return await crud.update_track(db, obj, data)


@router.delete("/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_track(track_id: int, db: AsyncSession = Depends(get_db)):
    obj = await crud.get_track(db, track_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Track not found")
    await crud.delete_track(db, obj)