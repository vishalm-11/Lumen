from fastapi import APIRouter, HTTPException
from services.news_service import fetch_news
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
        
        # Fetch headlines first (fast)
        headlines = fetch_news(country_name)
        print(f"Headlines fetched: {len(headlines)} items")
        print(f"Headlines content: {headlines}")
        
        # Filter out the "No recent news" fallback message
        headlines = [h for h in headlines if h.get("title") and "No recent news available" not in h.get("title", "")]

        print(f"Final headlines being returned: {len(headlines)} items")

        headline_titles = [h["title"] for h in headlines if h.get("title")]
        if not headline_titles:
            headline_titles = [f"Recent news about {country_name}"]
            print(f"WARNING: No valid headlines for summary, using default")

        loop = asyncio.get_event_loop()

        summary_future = loop.run_in_executor(executor, summarize_news, country_name, headline_titles, None)
        summary = await summary_future
        print(f"Summary generated: {len(summary)} characters")

        audio_base64 = await loop.run_in_executor(executor, speak, summary)
        print(f"Audio generated: {len(audio_base64)} characters")

        # Look up cause data for this country
        cause_entry = _CAUSES.get(country_name)
        cause = {
            "organization": cause_entry["organization"],
            "donationUrl": cause_entry["donationUrl"],
            "issue": cause_entry["issue"],
        } if cause_entry else None

        return {
            "country": country_name,
            "headlines": headlines,
            "summary": summary,
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

