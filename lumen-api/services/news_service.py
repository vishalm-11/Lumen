import os
import requests
import re
from typing import List, Dict

def clean(text: str) -> str:
    return re.sub(r'<[^>]+>', '', text).strip()

def fetch_news(country: str) -> List[Dict[str, str]]:
    """
    Returns list of dicts with 'title' and 'url' keys
    """
    print(f"=== Fetching news for {country} ===")
    headlines = _fetch_newsapi(country)
    print(f"NewsAPI returned {len(headlines)} headlines")
    
    if not headlines:
        print(f"No NewsAPI results, trying GDELT for {country}")
        headlines = _fetch_gdelt(country)
        print(f"GDELT returned {len(headlines)} headlines")
    
    if not headlines:
        print(f"WARNING: No headlines found for {country} from any source")
        # Return empty list instead of fallback message - let frontend handle the display
        return []
    
    # Filter out any "No recent news" messages that might have slipped through
    headlines = [h for h in headlines if h.get("title") and "No recent news available" not in h.get("title", "")]
    
    print(f"=== Returning {len(headlines)} headlines for {country} ===")
    if headlines:
        for i, h in enumerate(headlines[:3]):  # Print first 3 for debugging
            print(f"  Headline {i+1}: {h.get('title', 'NO TITLE')[:60]}")
    return headlines

def _fetch_newsapi(country: str) -> List[Dict[str, str]]:
    try:
        key = os.getenv("NEWS_API_KEY")
        if not key:
            print(f"NewsAPI key not set for {country}")
            return []
        
        # First try: Simple country name query (most reliable)
        print(f"NewsAPI: Trying simple query for {country}")
        r = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": country,
                "sortBy": "publishedAt",
                "pageSize": 20,
                "language": "en",
                "apiKey": key
            },
            timeout=10
        )
        data = r.json()
        
        # Check for errors
        if data.get("status") == "error":
            error_msg = data.get("message", "Unknown error")
            print(f"NewsAPI error for {country}: {error_msg}")
            if "rate limit" in error_msg.lower() or "429" in str(data):
                print("NewsAPI rate limited - will try GDELT")
            return []
        
        total_results = data.get("totalResults", 0)
        print(f"NewsAPI for {country}: status={data.get('status')} total={total_results}")
        
        articles = data.get("articles", [])
        result = []
        
        # Less strict filtering - get any valid articles
        for a in articles:
            title_raw = a.get("title", "")
            title = clean(title_raw)
            description = clean(a.get("description", ""))
            url = a.get("url")
            
            if not title or "[Removed]" in title or not url:
                continue
            
            # Skip obvious irrelevant content
            title_lower = title.lower()
            description_lower = description.lower()
            irrelevant = [
                "sport", "football", "soccer", "basketball", "game", "match",
                "entertainment", "celebrity", "movie", "music", "tv show",
                "recipe", "cooking", "food", "restaurant"
            ]
            
            is_irrelevant = any(ikw in title_lower or ikw in description_lower for ikw in irrelevant)
            
            # Accept article if it's not irrelevant
            # Note: NewsAPI query already filters by country, so we don't need to check again
            # But let's be less strict - only filter out obvious spam/irrelevant
            if not is_irrelevant and len(title) > 10:  # Ensure title is meaningful
                # Extract image URL and description
                image_url = a.get("urlToImage") or None
                # Only include articles with images
                if image_url and image_url.startswith("http"):
                    result.append({
                        "title": title,
                        "url": url,
                        "image": image_url,
                        "description": description[:200] if description else None  # First 200 chars
                    })
                    if len(result) >= 5:
                        break
        
        print(f"NewsAPI filtered to {len(result)} relevant headlines for {country}")
        
        # If we got some results, return them (even if less than 5)
        if result:
            print(f"NewsAPI returning {len(result)} headlines: {[r['title'][:50] for r in result]}")
            return result[:5]
        
        # If no results, try a broader search with keywords
        print(f"NewsAPI: No results with simple query, trying keyword search for {country}")
        query_fallback = f'"{country}" AND (government OR politics OR economy OR international)'
        r2 = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": query_fallback,
                "sortBy": "publishedAt",
                "pageSize": 15,
                "language": "en",
                "apiKey": key,
            },
            timeout=10
        )
        data2 = r2.json()
        
        if data2.get("status") == "error":
            print(f"NewsAPI fallback error: {data2.get('message')}")
            return []
        
        articles2 = data2.get("articles", [])
        for a in articles2:
            title = clean(a.get("title", ""))
            url = a.get("url")
            description = clean(a.get("description", ""))
            
            if not title or "[Removed]" in title or not url or len(title) < 10:
                continue
            
            # Light filtering for fallback - just skip obvious irrelevant
            title_lower = title.lower()
            description_lower = description.lower()
            irrelevant = ["sport", "football", "soccer", "basketball", "game", "match", "entertainment", "celebrity"]
            is_irrelevant = any(ikw in title_lower or ikw in description_lower for ikw in irrelevant)
            
            if not is_irrelevant:
                # Check if already added
                if not any(r["title"].lower() == title.lower() for r in result):
                    # Extract image URL and description
                    image_url = a.get("urlToImage") or None
                    # Only include articles with images
                    if image_url and image_url.startswith("http"):
                        result.append({
                            "title": title,
                            "url": url,
                            "image": image_url,
                            "description": description[:200] if description else None
                        })
                        if len(result) >= 5:
                            break
        
        print(f"NewsAPI total results after fallback: {len(result)}")
        return result[:5] if result else []
    except requests.exceptions.RequestException as e:
        print(f"NewsAPI request error for {country}: {e}")
        return []
    except Exception as e:
        print(f"NewsAPI error for {country}: {e}")
        import traceback
        print(traceback.format_exc())
        return []

def _fetch_gdelt(country: str) -> List[Dict[str, str]]:
    try:
        print(f"GDELT: Fetching headlines for {country}")
        r = requests.get(
            "https://api.gdeltproject.org/api/v2/doc/doc",
            params={
                "query": country,
                "mode": "artlist",
                "maxrecords": "10",
                "format": "json"
            },
            timeout=10
        )
        r.raise_for_status()
        data = r.json()
        
        # Handle different response formats
        articles = []
        if isinstance(data, dict):
            articles = data.get("articles", []) or data.get("docs", [])
        elif isinstance(data, list):
            articles = data
        
        print(f"GDELT for {country}: Found {len(articles)} articles")
        
        result = []
        for a in articles:
            if isinstance(a, dict):
                title = clean(a.get("title", "") or a.get("snippet", ""))
                url = a.get("url") or a.get("seendate")
            else:
                continue
            
            if title and title.strip() and "[Removed]" not in title:
                # Skip if title is too short or looks like a URL
                if len(title) > 10 and not title.startswith("http"):
                    result.append({
                        "title": title,
                        "url": url if url and isinstance(url, str) and url.startswith("http") else None
                    })
                    if len(result) >= 5:
                        break
        
        print(f"GDELT for {country}: Returning {len(result)} valid headlines")
        return result[:5] if result else []
    except requests.exceptions.RequestException as e:
        print(f"GDELT request error for {country}: {e}")
        return []
    except Exception as e:
        print(f"GDELT error for {country}: {e}")
        import traceback
        print(traceback.format_exc())
        return []
