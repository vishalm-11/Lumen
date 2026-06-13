import os
from pathlib import Path
from google import genai
import json
import traceback
import re

def _get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in environment variables")
    return genai.Client(api_key=api_key, http_options={"api_version": "v1"})

_causes_path = Path(__file__).parent.parent / "causes.json"
try:
    with open(_causes_path) as _f:
        _CAUSES = {entry["country"]: entry for entry in json.load(_f)["countries"]}
except Exception:
    _CAUSES = {}

def summarize_news(country: str, headlines: list, economics: dict = None) -> str:
    if headlines and isinstance(headlines[0], dict):
        headline_titles = [h.get("title", "") for h in headlines if h.get("title")]
    else:
        headline_titles = [h for h in headlines if isinstance(h, str)]

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in environment variables")

    headlines_text = "\n".join(f"- {h}" for h in headline_titles)

    cause = _CAUSES.get(country)
    cause_context = ""
    if cause:
        cause_context = f" Note that {cause['organization']} is one of the organizations actively working to help — mention them by name."

    prompt = f"""You are a compassionate humanitarian narrator. In 3-4 sentences, identify the most pressing ongoing humanitarian or environmental crisis affecting people in {country} right now. Explain why it matters and what real people are living through. Speak with warmth and genuine concern — not as a news anchor, but as someone who deeply cares.{cause_context} No bullet points, no markdown, plain spoken text only.

Recent news context:
{headlines_text}"""

    # Try different API versions and model names
    models_to_try = [
        ("v1", "gemini-2.5-flash"),
        ("v1", "gemini-2.0-flash"),
        ("v1", "gemini-2.5-flash-lite"),
        (None, "gemini-2.5-flash"),
        (None, "gemini-2.0-flash"),
        (None, "gemini-2.5-flash-lite"),
        ("v1", "gemini-flash-latest"),
        (None, "gemini-flash-latest"),
    ]
    
    last_error = None
    for api_version, model_name in models_to_try:
        try:
            if api_version:
                client = genai.Client(
                    api_key=api_key,
                    http_options={"api_version": api_version}
                )
            else:
                client = genai.Client(api_key=api_key)
            
            print(f"Trying model: {model_name} with API version: {api_version or 'default'}")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            
            if not response or not hasattr(response, 'text'):
                raise ValueError("Invalid response from Gemini API")
            
            text = response.text.strip()
            text = text.replace("```", "").strip()
            
            if not text:
                text = f"Recent developments in {country} continue to unfold as global observers monitor the situation closely."
            
            print(f"Successfully used model: {model_name}")
            return text
            
        except Exception as e:
            last_error = e
            print(f"Failed with {model_name} ({api_version or 'default'}): {str(e)[:100]}")
            continue
    
    raise Exception(f"Gemini API error: All model attempts failed. Last error: {str(last_error)}")

def get_sentiment(country: str, headlines: list) -> dict:
    try:
        client = _get_gemini_client()
        # Handle both dict and string formats
        if headlines and isinstance(headlines[0], dict):
            headline_titles = [h.get("title", "") for h in headlines if h.get("title")]
        else:
            headline_titles = [h for h in headlines if isinstance(h, str) and h.strip()]
        
        if not headline_titles:
            return {"score": 5, "label": "Neutral", "reasoning": "No headlines available."}
        
        headlines_text = "\n".join(f"- {h}" for h in headline_titles)
        
        prompt = f"""Analyze the overall sentiment of news about {country} based on these headlines.
Return a JSON object with exactly these fields:
- score: integer 1-10 (1=extremely negative, 5=neutral, 10=extremely positive)
- label: one of "Critical", "Negative", "Tense", "Neutral", "Stable", "Positive", "Optimistic"
- reasoning: one short sentence explaining the score

Headlines:
{headlines_text}

Respond with ONLY the JSON object. No markdown, no explanation."""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        
        if not response or not hasattr(response, 'text'):
            return {"score": 5, "label": "Neutral", "reasoning": "Unable to determine sentiment."}
        
        raw_text = response.text.strip()
        print(f"Sentiment raw response: {repr(raw_text)}")
        
        # Try multiple JSON extraction strategies
        text = raw_text
        
        # Try 1: direct parse after cleaning markdown
        try:
            text_clean = text.replace("```json", "").replace("```", "").strip()
            result = json.loads(text_clean)
            print(f"Parsed sentiment result (direct): {result}")
        except json.JSONDecodeError:
            # Try 2: extract JSON from markdown or text
            try:
                match = re.search(r'\{[^}]+\}', text, re.DOTALL)
                if match:
                    text_clean = match.group()
                    result = json.loads(text_clean)
                    print(f"Parsed sentiment result (regex extract): {result}")
                else:
                    raise ValueError("No JSON found")
            except (json.JSONDecodeError, ValueError):
                # Try 3: manual extraction
                if '"score"' in text:
                    score_match = re.search(r'"score"\s*:\s*(\d+)', text)
                    label_match = re.search(r'"label"\s*:\s*"([^"]+)"', text)
                    reasoning_match = re.search(r'"reasoning"\s*:\s*"([^"]+)"', text)
                    if score_match and label_match:
                        result = {
                            "score": int(score_match.group(1)),
                            "label": label_match.group(1),
                            "reasoning": reasoning_match.group(1) if reasoning_match else "Based on current headlines."
                        }
                        print(f"Parsed sentiment result (manual extract): {result}")
                    else:
                        raise ValueError("Could not extract sentiment fields")
                else:
                    raise ValueError("No score field found")
        
        # Validate and clamp score
        score = result.get("score", 5)
        score = max(1, min(10, int(score)))
        
        return {
            "score": score,
            "label": result.get("label", "Neutral"),
            "reasoning": result.get("reasoning", "Sentiment analysis completed.")
        }
    except Exception as e:
        print(f"Sentiment analysis error: {e}")
        print(traceback.format_exc())
        return {"score": 5, "label": "Neutral", "reasoning": "Unable to determine sentiment."}

def get_related_countries(country: str, headlines: list) -> list:
    try:
        client = _get_gemini_client()
        # Handle both dict and string formats
        if headlines and isinstance(headlines[0], dict):
            headline_titles = [h.get("title", "") for h in headlines if h.get("title")]
        else:
            headline_titles = [h for h in headlines if isinstance(h, str) and h.strip()]
        
        headlines_text = "\n".join(f"- {h}" for h in headline_titles)
        
        valid_countries = [
            "United States", "Canada", "Mexico", "Iran", "Iraq", "Israel",
            "Palestine", "Syria", "Yemen", "Saudi Arabia", "Turkey", "Lebanon",
            "Jordan", "Afghanistan", "Pakistan", "Kuwait", "Qatar", "UAE",
            "Oman", "Egypt", "Russia", "Ukraine", "United Kingdom", "France", "Germany",
            "China", "India", "Japan", "South Korea", "North Korea",
            "Brazil", "Argentina", "Nigeria", "South Africa", "Australia"
        ]
        
        prompt = f"""Based on these headlines about {country}, which other countries from this list are meaningfully mentioned or involved?
Valid countries: {', '.join(valid_countries)}
Headlines:
{headlines_text}

Return ONLY a JSON array of country name strings from the valid list. Maximum 4 countries. Do not include {country} itself. Example: ["Iran", "Israel", "United States"]
If no countries are mentioned, return an empty array: []"""

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        return [c for c in result if c in valid_countries and c != country][:4]
    except Exception as e:
        print(f"Error getting related countries for {country}: {e}")
        print(traceback.format_exc())
        return []
