#!/usr/bin/env python3
"""List available Gemini models"""
import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY not set")
    exit(1)

print("Listing available Gemini models...\n")

# Try v1 API
try:
    client_v1 = genai.Client(api_key=api_key, http_options={"api_version": "v1"})
    print("=== API Version v1 ===")
    models = client_v1.models.list()
    for model in models:
        if hasattr(model, 'name'):
            print(f"  - {model.name}")
except Exception as e:
    print(f"v1 API error: {e}\n")

# Try default API (might be v1beta)
try:
    client_default = genai.Client(api_key=api_key)
    print("=== Default API Version ===")
    models = client_default.models.list()
    for model in models:
        if hasattr(model, 'name'):
            print(f"  - {model.name}")
except Exception as e:
    print(f"Default API error: {e}\n")

print("\nDone!")
