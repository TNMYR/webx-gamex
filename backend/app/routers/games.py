from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/games", tags=["Games"])


@router.get("", response_model=list[schemas.Game])
async def read_games(db: AsyncSession = Depends(get_db)):
    return await crud.list_games(db)


@router.post("", response_model=schemas.Game, status_code=status.HTTP_201_CREATED)
async def create_game(data: schemas.GameCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_game(db, data)


@router.get("/{game_id}", response_model=schemas.Game)
async def read_game(game_id: int, db: AsyncSession = Depends(get_db)):
    obj = await crud.get_game(db, game_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Game not found")
    return obj


@router.patch("/{game_id}", response_model=schemas.Game)
async def update_game(game_id: int, data: schemas.GameUpdate, db: AsyncSession = Depends(get_db)):
    obj = await crud.get_game(db, game_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Game not found")
    return await crud.update_game(db, obj, data)


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_game(game_id: int, db: AsyncSession = Depends(get_db)):
    obj = await crud.get_game(db, game_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Game not found")
    await crud.delete_game(db, obj)