# Lumen — Global News Intelligence

A real-time global news intelligence platform for stock market analysis. World events move markets, and Lumen makes that connection visible. Explore an interactive 3D globe with a live markets dashboard, AI-powered news analysis, and real-time financial data.

## Setup

### 1. Get API Keys

- **Gemini**: https://aistudio.google.com/apikey
- **ElevenLabs**: https://elevenlabs.io (Settings → API Keys)
- **NewsAPI**: https://newsapi.org/register (free tier available)
- **Cesium Ion**: https://cesium.com/ion/tokens (free token)

### 2. Backend Setup

```bash
cd Lumen/lumen-api
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `lumen-api/.env` file with your API keys:

```
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
NEWS_API_KEY=your_newsapi_key_here
```

Start the backend server:

```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd Lumen/lumen-web
npm install
```

Create `lumen-web/.env` file with your Cesium token:

```
VITE_CESIUM_TOKEN=your_cesium_ion_token_here
```

Start the frontend development server:

```bash
npm run dev
```

### 4. Open the Application

Navigate to http://localhost:5173 in your browser.

Click any country on the globe to see real-time news summaries and hear them read aloud!

## Project Structure

```
Lumen/
├── lumen-api/          # FastAPI backend
│   ├── main.py         # FastAPI app entry point
│   ├── routers/        # API route handlers
│   └── services/       # News, Gemini, ElevenLabs, Economics services
└── lumen-web/          # React + Vite frontend
    ├── src/
    │   ├── components/ # React components (Globe, CountryPanel, MarketsSidebar, etc.)
    │   └── lib/        # API client
    └── index.html      # HTML entry point
```

## Features

- **Interactive 3D Globe**: Powered by CesiumJS with 50+ clickable countries
- **Live Markets Dashboard**: Persistent sidebar showing real-time stock index data for all tracked countries
- **Market Intelligence**: Sparkline charts, top affected stocks, and market briefs
- **Real-time News**: Fetches latest headlines from NewsAPI with GDELT fallback
- **AI Market Analysis**: Gemini 2.0 Flash generates financial news anchor summaries connecting events to markets
- **Text-to-Speech**: ElevenLabs provides realistic voice narration
- **Sentiment Analysis**: News sentiment scoring and related country connections
- **Modern UI**: Sleek dark theme with emerald green accents

## Technology Stack

**Backend:**
- FastAPI
- Google Gemini API
- ElevenLabs API
- NewsAPI / GDELT

**Frontend:**
- React 18
- Vite
- CesiumJS
- Tailwind CSS

## Notes

- The backend runs on port 8000
- The frontend runs on port 5173 (Vite default)
- CORS is configured to allow requests from localhost:5173
- All audio is returned as base64-encoded MP3 data
