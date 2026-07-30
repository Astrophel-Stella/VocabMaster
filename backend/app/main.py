"""FastAPI main application entry point"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.config import settings
from app.database import init_db
from app.api import auth, words, progress

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="VocabMaster API - 英语单词学习助手后端服务",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "tauri://localhost",      # Tauri desktop
        "https://tauri.localhost", # Tauri desktop (new)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio cache
media_dir = Path(__file__).parent.parent / "media"
media_dir.mkdir(exist_ok=True)
(media_dir / "audio" / "us").mkdir(parents=True, exist_ok=True)
(media_dir / "audio" / "uk").mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

# Include routers
app.include_router(auth.router)
app.include_router(words.router)
app.include_router(progress.router)


@app.on_event("startup")
def startup_event():
    """Initialize database on startup"""
    init_db()
    print("[OK] Database initialized")


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to VocabMaster API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
