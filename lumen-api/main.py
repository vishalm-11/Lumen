from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import country
import os

load_dotenv()

app = FastAPI(title="Lumen API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(country.router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/debug/keys")
def check_keys():
    """Debug endpoint to check if API keys are set (without exposing values)"""
    return {
        "GEMINI_API_KEY": "set" if os.getenv("GEMINI_API_KEY") else "missing",
        "ELEVENLABS_API_KEY": "set" if os.getenv("ELEVENLABS_API_KEY") else "missing",
        "NEWS_API_KEY": "set" if os.getenv("NEWS_API_KEY") else "missing",
    }
