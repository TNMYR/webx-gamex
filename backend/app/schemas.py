from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field

Category = Literal["Музыка", "Эффекты", "Инструменты", "Лицензия", "Ресурсы"]


class TrackCreate(BaseModel):
    title: str = Field(min_length=2, max_length=60)
    artist: str = Field(min_length=2, max_length=60)
    category: Category
    bpm: int = Field(ge=40, le=300)
    duration: int = Field(ge=1, le=3600)
    description: str | None = Field(default=None, max_length=160)


class TrackUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=60)
    artist: str | None = Field(default=None, min_length=2, max_length=60)
    category: Category | None = None
    bpm: int | None = Field(default=None, ge=40, le=300)
    duration: int | None = Field(default=None, ge=1, le=3600)
    description: str | None = None


class Track(BaseModel):
    id: int
    title: str
    artist: str
    category: str
    bpm: int
    duration: int
    description: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


class NewsCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=1)
    author: str = Field(min_length=2, max_length=100)


class News(BaseModel):
    id: int
    title: str
    content: str
    author: str
    published_at: datetime
    model_config = {"from_attributes": True}


class PostCreate(BaseModel):
    author: str = Field(min_length=2, max_length=60)
    message: str = Field(min_length=1, max_length=1000)


class Post(BaseModel):
    id: int
    author: str
    message: str
    created_at: datetime
    model_config = {"from_attributes": True}

class GameCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    genre: str = Field(min_length=1, max_length=100)
    platform: str = Field(min_length=1, max_length=100)
    release_year: int = Field(ge=1950, le=2100)
    rating: float | None = Field(default=None, ge=0, le=10)
    image_url: str | None = None


class GameUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    genre: str | None = Field(default=None, min_length=1, max_length=100)
    platform: str | None = Field(default=None, min_length=1, max_length=100)
    release_year: int | None = Field(default=None, ge=1950, le=2100)
    rating: float | None = Field(default=None, ge=0, le=10)
    image_url: str | None = None


class Game(BaseModel):
    id: int
    title: str
    description: str | None
    genre: str
    platform: str
    release_year: int
    rating: float | None
    image_url: str | None
    created_at: datetime
    model_config = {"from_attributes": True}