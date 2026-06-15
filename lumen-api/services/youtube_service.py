import os
import requests

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"


def search_video(country: str, issue: str | None = None) -> str | None:
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise ValueError("YOUTUBE_API_KEY not set in environment variables")

    if issue:
        query = f"{issue} {country} humanitarian appeal people affected stories"
    else:
        query = f"{country} humanitarian appeal people affected stories"

    response = requests.get(
        YOUTUBE_SEARCH_URL,
        params={
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": 1,
            "safeSearch": "moderate",
            "relevanceLanguage": "en",
            "key": api_key,
        },
        timeout=10,
    )
    response.raise_for_status()

    items = response.json().get("items", [])
    if not items:
        return None

    return items[0].get("id", {}).get("videoId")
