import os
import re
import requests

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

STOP_WORDS = {
    "the", "and", "or", "of", "in", "on", "from", "with", "for", "a", "an", "to",
    "its", "their", "this", "that", "are", "was", "were", "has", "have", "had",
    "into", "over", "under", "about", "after", "before", "between", "through",
}


def _extract_keywords(text: str, min_length: int = 4) -> set[str]:
    words = re.findall(r"[a-z0-9']+", text.lower())
    return {
        word
        for word in words
        if len(word) >= min_length and word not in STOP_WORDS
    }


def _build_search_query(country: str, issue: str | None) -> str:
    country = country.strip()
    if issue:
        return f"{country} {issue.strip()} women children humanitarian"
    return f"{country} humanitarian crisis women children"


def _is_title_relevant(title: str, country: str, issue: str | None) -> bool:
    title_lower = title.lower()
    country_lower = country.strip().lower()

    if country_lower and country_lower in title_lower:
        return True

    issue_keywords = _extract_keywords(issue or "")
    if any(keyword in title_lower for keyword in issue_keywords):
        return True

    country_keywords = _extract_keywords(country)
    return any(keyword in title_lower for keyword in country_keywords)


def search_video(country: str, issue: str | None = None) -> str | None:
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise ValueError("YOUTUBE_API_KEY not set in environment variables")

    query = _build_search_query(country, issue)

    response = requests.get(
        YOUTUBE_SEARCH_URL,
        params={
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": 5,
            "safeSearch": "moderate",
            "relevanceLanguage": "en",
            "key": api_key,
        },
        timeout=10,
    )
    response.raise_for_status()

    items = response.json().get("items", [])
    for item in items:
        video_id = item.get("id", {}).get("videoId")
        title = item.get("snippet", {}).get("title", "")
        if not video_id or not title:
            continue
        if _is_title_relevant(title, country, issue):
            return video_id

    return None
