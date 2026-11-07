"""
Заполнение базы данных тестовыми данными.
Запуск:  py seed.py
"""
import asyncio
import os
from pathlib import Path

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from dotenv import load_dotenv

# Загружаем путь к БД из .env
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./gamex.db")

# Если это SQLite — удаляем старый файл, чтобы начать с чистого листа
if "sqlite" in DATABASE_URL:
    db_path = DATABASE_URL.split("///")[-1]
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Удалён старый файл БД: {db_path}")

from app.database import Base, engine  # noqa: E402
from app import models  # noqa: E402

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


GAMES = [
    {"title": "Hollow Knight", "genre": "Metroidvania", "platform": "PC", "release_year": 2017, "rating": 9.2, "description": "Атмосферный метроидвания про путешествие по подземному королевству.", "image_url": "/icon/gamepad-svgrepo-com.svg"},
    {"title": "The Witcher 3", "genre": "RPG", "platform": "PC", "release_year": 2015, "rating": 9.8, "description": "Эпическая RPG о ведьмаке Геральте из Ривии.", "image_url": "/icon/gamepad-svgrepo-com.svg"},
    {"title": "Minecraft", "genre": "Sandbox", "platform": "PC", "release_year": 2011, "rating": 9.0, "description": "Песочница, где можно построить всё что угодно.", "image_url": "/icon/gamepad-svgrepo-com.svg"},
    {"title": "Elden Ring", "genre": "Souls-like", "platform": "PC", "release_year": 2022, "rating": 9.6, "description": "Открытый мир, сложные боссы и мрачная атмосфера.", "image_url": "/icon/gamepad-svgrepo-com.svg"},
    {"title": "Cyberpunk 2077", "genre": "Action RPG", "platform": "PC", "release_year": 2020, "rating": 8.5, "description": "Найт-Сити, импланты и погони.", "image_url": "/icon/gamepad-svgrepo-com.svg"},
    {"title": "Stardew Valley", "genre": "Simulation", "platform": "PC", "release_year": 2016, "rating": 9.1, "description": "Уютная ферма, общение с жителями и рыбалка.", "image_url": "/icon/gamepad-svgrepo-com.svg"},
    {"title": "Portal 2", "genre": "Puzzle", "platform": "PC", "release_year": 2011, "rating": 9.5, "description": "Головоломки с порталами и чёрный юмор GLaDOS.", "image_url": "/icon/gamepad-svgrepo-com.svg"},
    {"title": "Hades", "genre": "Roguelike", "platform": "PC", "release_year": 2020, "rating": 9.3, "description": "Побег из подземного царства Аида.", "image_url": "/icon/gamepad-svgrepo-com.svg"},
]

TRACKS = [
    {"title": "Neon Drift", "artist": "SynthWave", "category": "Музыка", "bpm": 128, "duration": 214, "description": "Синтвейв для ночных поездок"},
    {"title": "Deep Focus", "artist": "Ambient Lab", "category": "Музыка", "bpm": 72, "duration": 305, "description": "Спокойный эмбиент для работы"},
    {"title": "Cyber Pulse", "artist": "SynthWave", "category": "Музыка", "bpm": 112, "duration": 198, "description": "Энергичный киберпанк-трек"},
    {"title": "Impact Hit", "artist": "SFX Studio", "category": "Эффекты", "bpm": 40, "duration": 3, "description": "Мощный удар для трейлеров"},
    {"title": "Vinyl Crackle", "artist": "LoFi Co", "category": "Эффекты", "bpm": 40, "duration": 42, "description": "Шум винила, лёгкий фоновый"},
    {"title": "Acoustic Guitar", "artist": "Studio One", "category": "Инструменты", "bpm": 95, "duration": 128, "description": "Семпл акустической гитары"},
    {"title": "Drum Kit 808", "artist": "BeatSupply", "category": "Ресурсы", "bpm": 140, "duration": 90, "description": "Набор ударных 808"},
    {"title": "Royalty Pack", "artist": "Gamex Team", "category": "Лицензия", "bpm": 60, "duration": 60, "description": "Пакет лицензий для проектов"},
]

NEWS = [
    {"title": "Запуск Gamex 2.0", "content": "Мы полностью переписали бэкенд на FastAPI и теперь сайт работает в 5 раз быстрее!", "author": "Admin"},
    {"title": "Новая коллекция синтвейва", "content": "В аудио-библиотеку добавлено 10 новых треков в жанре SynthWave. Слушайте и скачивайте!", "author": "MusicBot"},
    {"title": "Конкурс на лучший пост", "content": "Пишите посты в разделе Community до конца месяца. Победитель получит 1000 бонусов.", "author": "CommunityManager"},
    {"title": "Обновление каталога игр", "content": "Добавили Elden Ring, Hades и Stardew Valley. Изучайте каталог!", "author": "Admin"},
]

POSTS = [
    {"author": "GamerX", "message": "Кто-нибудь пробовал новый билд в Cyberpunk? Мне зашло!"},
    {"author": "SynthLover", "message": "Ищу треки в стиле 80-х для своего проекта. Есть рекомендации?"},
    {"author": "DevBeginner", "message": "Сделал первый REST API на FastAPI. Это было проще, чем я думал!"},
    {"author": "NightOwl", "message": "Hollow Knight — это шедевр. Прошёл на 112%, не пожалел ни минуты."},
    {"author": "MusicMaker", "message": "Выложил новый семпл в раздел Ресурсы. Пользуйтесь!"},
]


async def main():
    print("Создаём таблицы...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        print("Добавляем игры...")
        for g in GAMES:
            session.add(models.Game(**g))

        print("Добавляем треки...")
        for t in TRACKS:
            session.add(models.Track(**t))

        print("Добавляем новости...")
        for n in NEWS:
            session.add(models.NewsArticle(**n))

        print("Добавляем посты...")
        for p in POSTS:
            session.add(models.Post(**p))

        await session.commit()

    print("Готово! База данных заполнена тестовыми данными.")
    print(f"Игр: {len(GAMES)}, Треков: {len(TRACKS)}, Новостей: {len(NEWS)}, Постов: {len(POSTS)}")


if __name__ == "__main__":
    asyncio.run(main())