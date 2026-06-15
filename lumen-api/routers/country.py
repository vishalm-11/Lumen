from fastapi import APIRouter, HTTPException
from services.gemini_service import summarize_news
from services.elevenlabs_service import speak
import asyncio
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()
executor = ThreadPoolExecutor(max_workers=3)

_causes_path = Path(__file__).parent.parent / "causes.json"
try:
    with open(_causes_path) as _f:
        _CAUSES = {entry["country"]: entry for entry in json.load(_f)["countries"]}
except Exception:
    _CAUSES = {}

@router.get("/country/{country_name}")
async def get_country_data(country_name: str):
    try:
        print(f"Fetching data for country: {country_name}")

        loop = asyncio.get_event_loop()

        briefing_future = loop.run_in_executor(executor, summarize_news, country_name)
        briefing = await briefing_future
        summary = briefing["summary"]
        key_stats = briefing.get("key_stats", [])
        print(f"Summary generated: {len(summary)} characters, {len(key_stats)} stats")

        audio_base64 = await loop.run_in_executor(executor, speak, summary)
        print(f"Audio generated: {len(audio_base64)} characters")

        cause_entry = _CAUSES.get(country_name)
        cause = {
            "organization": cause_entry["organization"],
            "donationUrl": cause_entry["donationUrl"],
            "issue": cause_entry["issue"],
        } if cause_entry else None

        return {
            "country": country_name,
            "summary": summary,
            "key_stats": key_stats,
            "audio_base64": audio_base64,
            "cause": cause,
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error processing {country_name}: {error_details}")
        raise HTTPException(status_code=500, detail=f"Error processing {country_name}: {str(e)}")
