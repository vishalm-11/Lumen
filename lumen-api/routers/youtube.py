from fastapi import APIRouter, HTTPException, Query
from services.youtube_service import search_video
from services.causes_service import lookup_cause

router = APIRouter()


@router.get("/youtube/{country_name}")
def get_youtube_video(country_name: str, issue: str | None = Query(None)):
    try:
        country_name = country_name.strip()
        cause = lookup_cause(country_name)
        resolved_issue = (issue or (cause or {}).get("issue") or "").strip() or None
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
