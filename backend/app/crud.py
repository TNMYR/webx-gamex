from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app import models, schemas


# ---------- Track ----------
async def list_tracks(db: AsyncSession) -> list[models.Track]:
    res = await db.execute(select(models.Track).order_by(models.Track.id))
    return list(res.scalars().all())


async def get_track(db: AsyncSession, track_id: int) -> models.Track | None:
    return await db.get(models.Track, track_id)


async def create_track(db: AsyncSession, data: schemas.TrackCreate) -> models.Track:
    obj = models.Track(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_track(db: AsyncSession, obj: models.Track, data: schemas.TrackUpdate) -> models.Track:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_track(db: AsyncSession, obj: models.Track) -> None:
    await db.delete(obj)
    await db.commit()


# ---------- News ----------
async def list_news(db: AsyncSession):
    res = await db.execute(select(models.NewsArticle).order_by(models.NewsArticle.id.desc()))
    return list(res.scalars().all())


async def get_news(db: AsyncSession, news_id: int):
    return await db.get(models.NewsArticle, news_id)


async def create_news(db: AsyncSession, data: schemas.NewsCreate):
    obj = models.NewsArticle(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_news(db: AsyncSession, obj) -> None:
    await db.delete(obj)
    await db.commit()


# ---------- Post ----------
async def list_posts(db: AsyncSession):
    res = await db.execute(select(models.Post).order_by(models.Post.id.desc()))
    return list(res.scalars().all())


async def create_post(db: AsyncSession, data: schemas.PostCreate):
    obj = models.Post(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


# ---------- Game ----------
async def list_games(db: AsyncSession):
    res = await db.execute(select(models.Game).order_by(models.Game.id))
    return list(res.scalars().all())


async def get_game(db: AsyncSession, game_id: int):
    return await db.get(models.Game, game_id)


async def create_game(db: AsyncSession, data: schemas.GameCreate):
    obj = models.Game(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def update_game(db: AsyncSession, obj: models.Game, data: schemas.GameUpdate):
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.commit()
    await db.refresh(obj)
    return obj


async def delete_game(db: AsyncSession, obj: models.Game) -> None:
    await db.delete(obj)
    await db.commit()