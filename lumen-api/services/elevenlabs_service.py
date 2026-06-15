import os
import base64
import requests

AUDIO_ENABLED = True

VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Sarah — warm, empathetic narrator

def speak(text: str) -> str:
    if not AUDIO_ENABLED:
        return ""

    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not set in environment variables")
    
    if not text or len(text.strip()) == 0:
        raise ValueError("Cannot generate audio for empty text")
    
    print(f"[ElevenLabs] Key: {os.getenv('ELEVENLABS_API_KEY', 'NOT SET')[:12]}...")
    
    try:
        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg"
            },
            json={
                "text": text,
                "model_id": "eleven_turbo_v2_5",
                "voice_settings": {
                    "stability": 0.65,
                    "similarity_boost": 0.8,
                    "style": 0.35,
                    "use_speaker_boost": True
                }
            },
            timeout=30
        )
        
        print(f"[ElevenLabs] Response status: {response.status_code}")
        print(f"[ElevenLabs] Response body: {response.text[:200]}")
        
        response.raise_for_status()
        
        if not response.content:
            raise ValueError("Empty audio response from ElevenLabs")
        
        return base64.b64encode(response.content).decode("utf-8")
    except requests.exceptions.RequestException as e:
        raise Exception(f"ElevenLabs API error: {str(e)}")
