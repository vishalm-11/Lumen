from fastapi import APIRouter, HTTPException, Query
from pathlib import Path
import json
from services.youtube_service import search_video

router = APIRouter()

_causes_path = Path(__file__).parent.parent / "causes.json"
try:
    with open(_causes_path) as _f:
        _CAUSES = {entry["country"]: entry for entry in json.load(_f)["countries"]}
except Exception:
    _CAUSES = {}


@router.get("/youtube/{country_name}")
def get_youtube_video(country_name: str, issue: str | None = Query(None)):
    try:
        resolved_issue = issue or (_CAUSES.get(country_name) or {}).get("issue")
        video_id = search_video(country_name, resolved_issue)

        if not video_id:
            raise HTTPException(status_code=404, detail=f"No YouTube video found for {country_name}")

        return {"video_id": video_id}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube search failed: {str(e)}")
