import os
import base64
import requests

AUDIO_ENABLED = True

VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Sarah — warm, empathetic narrator


def _get_api_keys() -> list[str]:
    keys = []
    for i in range(1, 4):
        key = os.getenv(f"ELEVENLABS_API_KEY_{i}", "").strip()
        if key:
            keys.append(key)

    # Support legacy single-key env var as a fallback slot
    legacy = os.getenv("ELEVENLABS_API_KEY", "").strip()
    if legacy and legacy not in keys:
        keys.append(legacy)

    return keys


def _speak_with_key(text: str, api_key: str) -> str:
    response = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        json={
            "text": text,
            "model_id": "eleven_turbo_v2_5",
            "voice_settings": {
                "stability": 0.65,
                "similarity_boost": 0.8,
                "style": 0.35,
                "use_speaker_boost": True,
            },
        },
        timeout=30,
    )

    print(f"[ElevenLabs] Response status: {response.status_code}")
    if response.status_code >= 400:
        print(f"[ElevenLabs] Response body: {response.text[:200]}")

    response.raise_for_status()

    if not response.content:
        raise ValueError("Empty audio response from ElevenLabs")

    return base64.b64encode(response.content).decode("utf-8")


def speak(text: str) -> dict:
    """Generate narration audio. Returns { audio, fallback }."""
    if not AUDIO_ENABLED:
        return {"audio": None, "fallback": False}

    if not text or len(text.strip()) == 0:
        return {"audio": None, "fallback": True}

    keys = _get_api_keys()
    if not keys:
        print("[ElevenLabs] No API keys configured (ELEVENLABS_API_KEY_1/2/3)")
        return {"audio": None, "fallback": True}

    last_error = None
    for index, api_key in enumerate(keys, start=1):
        print(f"[ElevenLabs] Trying key {index} ({api_key[:8]}...)")
        try:
            audio = _speak_with_key(text, api_key)
            print(f"[ElevenLabs] Success with key {index}")
            return {"audio": audio, "fallback": False}
        except Exception as e:
            last_error = e
            print(f"[ElevenLabs] Key {index} failed: {e}")
            continue

    print(f"[ElevenLabs] All keys failed. Last error: {last_error}")
    return {"audio": None, "fallback": True}
