from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db

# Import all models so Base.metadata.create_all picks them up
import app.models.paper  # noqa: F401
import app.models.collection  # noqa: F401
import app.models.trail  # noqa: F401
import app.models.author  # noqa: F401
import app.models.monitor  # noqa: F401
import app.models.zotero  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="LitHelper", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "app://.", "file://"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": "LitHelper"}


# Import and register routers
from app.routers import (  # noqa: E402
    search, papers, citations, collections, discovery,
    trails, authors, monitors, import_export, zotero, sharing,
)

app.include_router(search.router, prefix="/api")
app.include_router(papers.router, prefix="/api")
app.include_router(citations.router, prefix="/api")
app.include_router(collections.router, prefix="/api")
app.include_router(discovery.router, prefix="/api")
app.include_router(trails.router, prefix="/api")
app.include_router(authors.router, prefix="/api")
app.include_router(monitors.router, prefix="/api")
app.include_router(import_export.router, prefix="/api")
app.include_router(zotero.router, prefix="/api")
app.include_router(sharing.router, prefix="/api")
