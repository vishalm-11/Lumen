import os
from google import genai
import json
import traceback
import re
from services.causes_service import lookup_cause

def _get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in environment variables")
    return genai.Client(api_key=api_key, http_options={"api_version": "v1"})

def _parse_briefing_response(raw_text: str, country: str) -> dict:
    text = raw_text.strip().replace("```json", "").replace("```", "").strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if not match:
            return {
                "summary": text or f"{country} faces ongoing humanitarian and environmental challenges that continue to affect communities across the region.",
                "key_stats": [],
            }
        try:
            result = json.loads(match.group())
        except json.JSONDecodeError:
            return {
                "summary": text or f"{country} faces ongoing humanitarian and environmental challenges that continue to affect communities across the region.",
                "key_stats": [],
            }

    summary = (result.get("summary") or "").strip()
    if not summary:
        summary = f"{country} faces ongoing humanitarian and environmental challenges that continue to affect communities across the region."

    key_stats = []
    for stat in result.get("key_stats", [])[:3]:
        if not isinstance(stat, dict):
            continue
        value = str(stat.get("value", "")).strip()
        label = str(stat.get("label", "")).strip()
        if value and label:
            key_stats.append({"value": value, "label": label})

    return {"summary": summary, "key_stats": key_stats}


def summarize_news(country: str, headlines: list = None, economics: dict = None) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in environment variables")

    cause = lookup_cause(country)
    if cause:
        issue = cause["issue"]
        organization = cause["organization"]
        topic_context = f"""MANDATORY TOPIC — you must write ONLY about this exact issue. Do not discuss any other crisis, conflict, or historical event.

Country: {country.strip()}
Issue (required topic): "{issue}"
Supporting organization: {organization}

Every sentence in the summary and every statistic must relate directly to "{issue}" in {country}.
Do NOT write about unrelated topics (for example, do not write about past wars or conflicts if the issue is economic or environmental).
In the final sentence, naturally mention that {organization} is working to address "{issue}"."""
    else:
        topic_context = f"""{country.strip()} is not in our causes database. Using your general knowledge only, identify the single most well-known ongoing humanitarian or environmental crisis affecting {country} (not a fleeting news story). Write the briefing and statistics entirely about that issue."""

    prompt = f"""You are writing a factual humanitarian briefing about {country}.

{topic_context}

Important rules:
- Do NOT use current news, headlines, or recent events. Ignore breaking stories entirely.
- Use only well-established background knowledge about the issue.
- The summary must be at most 3 sentences: clear, informative, and factual — not emotional or sympathetic.
- Focus on: what the issue is, who it affects, and the scale of the problem.
- key_stats must contain 2-3 real, well-known statistics about this specific issue (e.g. deforestation rates, people displaced, hectares lost). Draw from widely cited figures in your training knowledge — not from news. Use rounded values with "est." when appropriate.

Return a JSON object with exactly these fields:
- summary: plain-text string (max 3 sentences)
- key_stats: array of 2-3 objects, each with:
  - value: short statistic (e.g. "2.3M", "40%", "10,000 km²")
  - label: brief label (e.g. "displaced", "forest lost since 2020")

Respond with ONLY the JSON object. No markdown, no explanation."""

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
            briefing = _parse_briefing_response(text, country)
            
            print(f"Successfully used model: {model_name}")
            return briefing
            
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
