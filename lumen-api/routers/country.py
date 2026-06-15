from fastapi import APIRouter, HTTPException
from services.gemini_service import summarize_news
from services.elevenlabs_service import speak, AUDIO_ENABLED
from services.causes_service import lookup_cause
import asyncio
from concurrent.futures import ThreadPoolExecutor

router = APIRouter()
executor = ThreadPoolExecutor(max_workers=3)

@router.get("/country/{country_name}")
async def get_country_data(country_name: str):
    try:
        country_name = country_name.strip()
        print(f"Fetching data for country: {country_name}")

        loop = asyncio.get_event_loop()

        briefing_future = loop.run_in_executor(executor, summarize_news, country_name)
        briefing = await briefing_future
        summary = briefing["summary"]
        key_stats = briefing.get("key_stats", [])
        print(f"Summary generated: {len(summary)} characters, {len(key_stats)} stats")

        audio = None
        fallback = False
        if AUDIO_ENABLED:
            audio_result = await loop.run_in_executor(executor, speak, summary)
            audio = audio_result["audio"]
            fallback = audio_result["fallback"]
            if audio:
                print(f"Audio generated: {len(audio)} characters")
            elif fallback:
                print("Audio fallback: all ElevenLabs keys failed, continuing without narration")
            else:
                print("Audio generation skipped")
        else:
            print("Audio generation skipped (AUDIO_ENABLED=False)")

        cause_entry = lookup_cause(country_name)
        cause = {
            "organization": cause_entry["organization"],
            "donationUrl": cause_entry["donationUrl"],
            "issue": cause_entry["issue"],
        } if cause_entry else None

        return {
            "country": country_name,
            "summary": summary,
            "key_stats": key_stats,
            "audio": audio,
            "audio_base64": audio,
            "fallback": fallback,
            "cause": cause,
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error processing {country_name}: {error_details}")
        raise HTTPException(status_code=500, detail=f"Error processing {country_name}: {str(e)}")
