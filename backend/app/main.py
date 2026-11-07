from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import tracks, news, posts, games
from pathlib import Path
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Gamex API",
    version="1.0.0",
    description="REST API для Gamex: треки, новости, посты сообщества",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # для лабы; на проде сузить
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tracks.router, prefix="/api")
app.include_router(news.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(games.router, prefix="/api")

@app.get("/api/health", tags=["System"])
async def health():
    return {"status": "ok"}



# --- Фронтенд (статика) ---
# Путь: backend/app/main.py → .parent=app → .parent=backend → .parent=корень проекта
FRONT_DIR = Path(__file__).resolve().parent.parent.parent / "front"

app.mount("/styles", StaticFiles(directory=FRONT_DIR / "styles"), name="styles")
app.mount("/js",     StaticFiles(directory=FRONT_DIR / "js"),     name="js")
app.mount("/icon",   StaticFiles(directory=FRONT_DIR / "icon"),   name="icon")
app.mount("/pages",  StaticFiles(directory=FRONT_DIR / "pages", html=True), name="pages")


@app.get("/", include_in_schema=False)
async def index():
    return FileResponse(FRONT_DIR / "index.html")

@app.get("/index.html", include_in_schema=False)
async def index_html():
    return FileResponse(FRONT_DIR / "index.html")