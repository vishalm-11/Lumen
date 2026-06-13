import os
import requests
import yfinance as yf
import json
import re
from google import genai

# Map country names to their currency code and major stock index ticker
COUNTRY_ECONOMIC_DATA = {
    "United States": {"currency": "USD", "index": "^GSPC", "index_name": "S&P 500"},
    "Canada": {"currency": "CAD", "index": "^GSPTSE", "index_name": "TSX"},
    "Mexico": {"currency": "MXN", "index": "^MXX", "index_name": "IPC"},
    "Iran": {"currency": "IRR", "index": None, "index_name": None},
    "Iraq": {"currency": "IQD", "index": None, "index_name": None},
    "Israel": {"currency": "ILS", "index": "^TA125.TA", "index_name": "TA-125"},
    "Palestine": {"currency": "ILS", "index": None, "index_name": None},
    "Syria": {"currency": "SYP", "index": None, "index_name": None},
    "Yemen": {"currency": "YER", "index": None, "index_name": None},
    "Saudi Arabia": {"currency": "SAR", "index": "^TASI.SR", "index_name": "Tadawul"},
    "Turkey": {"currency": "TRY", "index": "XU100.IS", "index_name": "BIST 100"},
    "Lebanon": {"currency": "LBP", "index": None, "index_name": None},
    "Jordan": {"currency": "JOD", "index": None, "index_name": None},
    "Afghanistan": {"currency": "AFN", "index": None, "index_name": None},
    "Pakistan": {"currency": "PKR", "index": "^KSE100", "index_name": "KSE 100"},
    "Kuwait": {"currency": "KWD", "index": None, "index_name": None},
    "Qatar": {"currency": "QAR", "index": None, "index_name": None},
    "UAE": {"currency": "AED", "index": "^DFMGI", "index_name": "DFM"},
    "Oman": {"currency": "OMR", "index": None, "index_name": None},
    "Egypt": {"currency": "EGP", "index": "^EGX30", "index_name": "EGX 30"},
    "Russia": {"currency": "RUB", "index": None, "index_name": None},
    "Ukraine": {"currency": "UAH", "index": None, "index_name": None},
    "United Kingdom": {"currency": "GBP", "index": "^FTSE", "index_name": "FTSE 100"},
    "France": {"currency": "EUR", "index": "^FCHI", "index_name": "CAC 40"},
    "Germany": {"currency": "EUR", "index": "^GDAXI", "index_name": "DAX"},
    "Spain": {"currency": "EUR", "index": "^IBEX", "index_name": "IBEX 35"},
    "Italy": {"currency": "EUR", "index": "^FTSEMIB.MI", "index_name": "FTSE MIB"},
    "Poland": {"currency": "PLN", "index": "^WIG", "index_name": "WIG"},
    "Netherlands": {"currency": "EUR", "index": "^AEX", "index_name": "AEX"},
    "Greece": {"currency": "EUR", "index": "^ATHEX", "index_name": "ASE"},
    "Sweden": {"currency": "SEK", "index": "^OMX", "index_name": "OMX Stockholm 30"},
    "Norway": {"currency": "NOK", "index": "^OSEAX", "index_name": "OSEBX"},
    "Finland": {"currency": "EUR", "index": "^OMXH25", "index_name": "OMX Helsinki 25"},
    "Belgium": {"currency": "EUR", "index": "^BFX", "index_name": "BEL 20"},
    "Switzerland": {"currency": "CHF", "index": "^SSMI", "index_name": "Swiss Market"},
    "Austria": {"currency": "EUR", "index": "^ATX", "index_name": "ATX"},
    "Portugal": {"currency": "EUR", "index": "^PSI20", "index_name": "PSI 20"},
    "Romania": {"currency": "RON", "index": None, "index_name": None},
    "Hungary": {"currency": "HUF", "index": "^BUX", "index_name": "BUX"},
    "Czech Republic": {"currency": "CZK", "index": "^PX", "index_name": "PX"},
    "Serbia": {"currency": "RSD", "index": None, "index_name": None},
    "Croatia": {"currency": "EUR", "index": None, "index_name": None},
    "Belarus": {"currency": "BYN", "index": None, "index_name": None},
    "Bulgaria": {"currency": "BGN", "index": None, "index_name": None},
    "China": {"currency": "CNY", "index": "^SSEC", "index_name": "Shanghai Composite"},
    "India": {"currency": "INR", "index": "^BSESN", "index_name": "BSE Sensex"},
    "Japan": {"currency": "JPY", "index": "^N225", "index_name": "Nikkei 225"},
    "South Korea": {"currency": "KRW", "index": "^KS11", "index_name": "KOSPI"},
    "North Korea": {"currency": "KPW", "index": None, "index_name": None},
    "Indonesia": {"currency": "IDR", "index": "^JKSE", "index_name": "Jakarta Composite"},
    "Thailand": {"currency": "THB", "index": "^SET.BK", "index_name": "SET"},
    "Vietnam": {"currency": "VND", "index": "^VNI", "index_name": "VN-Index"},
    "Philippines": {"currency": "PHP", "index": "^PSI", "index_name": "PSEi"},
    "Malaysia": {"currency": "MYR", "index": "^KLSE", "index_name": "FTSE Bursa Malaysia"},
    "Singapore": {"currency": "SGD", "index": "^STI", "index_name": "Straits Times"},
    "Myanmar": {"currency": "MMK", "index": None, "index_name": None},
    "Bangladesh": {"currency": "BDT", "index": None, "index_name": None},
    "Sri Lanka": {"currency": "LKR", "index": "^CSE", "index_name": "CSE All Share"},
    "Nepal": {"currency": "NPR", "index": None, "index_name": None},
    "Kazakhstan": {"currency": "KZT", "index": None, "index_name": None},
    "Uzbekistan": {"currency": "UZS", "index": None, "index_name": None},
    "Kyrgyzstan": {"currency": "KGS", "index": None, "index_name": None},
    "Tajikistan": {"currency": "TJS", "index": None, "index_name": None},
    "Mongolia": {"currency": "MNT", "index": None, "index_name": None},
    "Taiwan": {"currency": "TWD", "index": "^TWII", "index_name": "Taiwan Weighted"},
    "Hong Kong": {"currency": "HKD", "index": "^HSI", "index_name": "Hang Seng"},
    "Brazil": {"currency": "BRL", "index": "^BVSP", "index_name": "Bovespa"},
    "Argentina": {"currency": "ARS", "index": "^MERV", "index_name": "MERVAL"},
    "Nigeria": {"currency": "NGN", "index": None, "index_name": None},
    "South Africa": {"currency": "ZAR", "index": "^JN0U.JO", "index_name": "JSE"},
    "Ethiopia": {"currency": "ETB", "index": None, "index_name": None},
    "Kenya": {"currency": "KES", "index": None, "index_name": None},
    "Tanzania": {"currency": "TZS", "index": None, "index_name": None},
    "Uganda": {"currency": "UGX", "index": None, "index_name": None},
    "Ghana": {"currency": "GHS", "index": None, "index_name": None},
    "Morocco": {"currency": "MAD", "index": None, "index_name": None},
    "Algeria": {"currency": "DZD", "index": None, "index_name": None},
    "Tunisia": {"currency": "TND", "index": None, "index_name": None},
    "Libya": {"currency": "LYD", "index": None, "index_name": None},
    "Sudan": {"currency": "SDG", "index": None, "index_name": None},
    "Somalia": {"currency": "SOS", "index": None, "index_name": None},
    "Mali": {"currency": "XOF", "index": None, "index_name": None},
    "Niger": {"currency": "XOF", "index": None, "index_name": None},
    "Chad": {"currency": "XAF", "index": None, "index_name": None},
    "Cameroon": {"currency": "XAF", "index": None, "index_name": None},
    "Democratic Republic of the Congo": {"currency": "CDF", "index": None, "index_name": None},
    "Angola": {"currency": "AOA", "index": None, "index_name": None},
    "Mozambique": {"currency": "MZN", "index": None, "index_name": None},
    "Zimbabwe": {"currency": "ZWL", "index": None, "index_name": None},
    "Madagascar": {"currency": "MGA", "index": None, "index_name": None},
    "Australia": {"currency": "AUD", "index": "^AXJO", "index_name": "ASX 200"},
    "New Zealand": {"currency": "NZD", "index": "^NZ50", "index_name": "NZX 50"},
    "Papua New Guinea": {"currency": "PGK", "index": None, "index_name": None},
    "Fiji": {"currency": "FJD", "index": None, "index_name": None},
    "Chile": {"currency": "CLP", "index": "^IPSA", "index_name": "IPSA"},
    "Colombia": {"currency": "COP", "index": "^COLCAP", "index_name": "COLCAP"},
    "Venezuela": {"currency": "VES", "index": None, "index_name": None},
    "Peru": {"currency": "PEN", "index": "^SPBLPGPT", "index_name": "S&P/BVL"},
    "Ecuador": {"currency": "USD", "index": None, "index_name": None},
    "Bolivia": {"currency": "BOB", "index": None, "index_name": None},
    "Paraguay": {"currency": "PYG", "index": None, "index_name": None},
    "Uruguay": {"currency": "UYU", "index": None, "index_name": None},
}

def get_exchange_rate(currency_code: str) -> dict:
    """Get exchange rate vs USD for a currency code."""
    if currency_code == "USD":
        # Skip currency display for USD since it's the base currency
        print("Skipping currency display for USD (base currency)")
        return None
    try:
        api_key = os.getenv("EXCHANGE_RATE_API_KEY")
        if not api_key:
            print(f"EXCHANGE_RATE_API_KEY not set in environment - cannot fetch rate for {currency_code}")
            return None
        print(f"Fetching exchange rate for {currency_code}")
        r = requests.get(
            f"https://v6.exchangerate-api.com/v6/{api_key}/latest/USD",
            timeout=10
        )
        r.raise_for_status()
        data = r.json()
        if "conversion_rates" not in data:
            print(f"Invalid response from exchange rate API: {data}")
            return None
        rate = data["conversion_rates"].get(currency_code)
        if not rate:
            print(f"Currency code {currency_code} not found in API response")
            return None
        return {
            "rate": rate,
            "formatted": f"1 USD = {rate:,.2f} {currency_code}"
        }
    except requests.exceptions.RequestException as e:
        print(f"Exchange rate API request error: {e}")
        return None
    except Exception as e:
        print(f"Exchange rate API error: {e}")
        return None

def get_stock_fallback(ticker: str, index_name: str) -> dict:
    """Fallback method to get stock data from Yahoo Finance API directly."""
    try:
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=5)
        r.raise_for_status()
        data = r.json()
        meta = data["chart"]["result"][0]["meta"]
        current = meta["regularMarketPrice"]
        prev = meta.get("previousClose") or meta.get("chartPreviousClose")
        if not prev:
            print(f"No previous close price found for {ticker}")
            return None
        change_pct = ((current - prev) / prev) * 100
        arrow = "↑" if change_pct >= 0 else "↓"
        return {
            "index_name": index_name,
            "value": f"{current:,.2f}",
            "change_pct": round(change_pct, 2),
            "formatted": f"{index_name}  {current:,.2f}  {arrow} {abs(change_pct):.2f}%",
            "direction": "up" if change_pct >= 0 else "down"
        }
    except Exception as e:
        print(f"Stock fallback failed for {ticker}: {e}")
        return None

def get_stock_index(ticker: str, index_name: str) -> dict:
    """Get today's stock index performance with sparkline data."""
    if not ticker:
        print(f"No ticker provided for stock index")
        return None
    print(f"Fetching stock data for {ticker} ({index_name})")
    # Try yfinance first
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(period="5d")
        print(f"yfinance returned {len(hist)} days of data for {ticker}")
        if hist.empty:
            print(f"No data returned for ticker {ticker}, trying fallback")
            return get_stock_fallback(ticker, index_name)
        if len(hist) < 2:
            # If only one day of data, try fallback
            print(f"Only one day of data for {ticker}, trying fallback")
            return get_stock_fallback(ticker, index_name)
        prev_close = hist['Close'].iloc[-2] if len(hist) >= 2 else hist['Close'].iloc[-1]
        current = hist['Close'].iloc[-1]
        change_pct = ((current - prev_close) / prev_close) * 100
        arrow = "↑" if change_pct >= 0 else "↓"
        
        # Get sparkline data (last 5 days)
        sparkline = hist['Close'].tail(5).tolist()
        
        return {
            "index_name": index_name,
            "value": f"{current:,.2f}",
            "change_pct": round(change_pct, 2),
            "formatted": f"{index_name} {current:,.2f} {arrow} {abs(change_pct):.2f}%",
            "direction": "up" if change_pct >= 0 else "down",
            "sparkline": sparkline
        }
    except Exception as e:
        print(f"Stock index error for {ticker}: {e}")
        import traceback
        print(traceback.format_exc())
        # Try fallback if yfinance fails
        print(f"Trying fallback API for {ticker}")
        return get_stock_fallback(ticker, index_name)

def get_top_stocks(country: str, headlines: list) -> list:
    """Get top 3 stocks most relevant to country's current news."""
    try:
        # Step 1: Ask Gemini which tickers are most relevant
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("GEMINI_API_KEY not set, cannot fetch top stocks")
            return []
        
        client = genai.Client(api_key=api_key, http_options={"api_version": "v1"})
        
        # Extract headline titles
        if headlines and isinstance(headlines[0], dict):
            headline_titles = [h.get("title", "") for h in headlines if h.get("title")]
        else:
            headline_titles = [h for h in headlines if isinstance(h, str)]
        
        if not headline_titles:
            return []
        
        # Limit headlines to first 5 to speed up Gemini call
        headlines_text = "\n".join(f"- {h}" for h in headline_titles[:5])
        prompt = f"""Based on these news headlines about {country}, identify 3 publicly traded stock tickers on major exchanges (NYSE, NASDAQ, LSE, TSE, etc.) most likely to be affected by these events.
Return ONLY a JSON array of objects with ticker and company_name fields.
Example: [{{"ticker": "XOM", "company_name": "ExxonMobil"}}, ...]
Headlines: {headlines_text}
Return only tickers that are real and actively traded. No markdown."""

        try:
            response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
            text = response.text.strip().replace("```json", "").replace("```", "").strip()
            match = re.search(r'\[.*?\]', text, re.DOTALL)
            stocks_meta = json.loads(match.group()) if match else []
        except Exception as e:
            print(f"Error parsing Gemini response for top stocks: {e}")
            return []

        # Step 2: Fetch prices (with timeout protection)
        results = []
        for stock in stocks_meta[:3]:
            try:
                ticker = stock.get("ticker", "")
                if not ticker:
                    continue
                # Use shorter period for faster fetching
                t = yf.Ticker(ticker)
                hist = t.history(period="2d")
                if len(hist) < 1:
                    continue
                current = hist['Close'].iloc[-1]
                prev = hist['Close'].iloc[-2] if len(hist) >= 2 else current
                change_pct = ((current - prev) / prev) * 100
                results.append({
                    "ticker": ticker,
                    "company_name": stock.get("company_name", ticker),
                    "price": round(current, 2),
                    "change_pct": round(change_pct, 2),
                    "direction": "up" if change_pct >= 0 else "down"
                })
                # Stop if we have 3 stocks (don't wait for all)
                if len(results) >= 3:
                    break
            except Exception as e:
                print(f"Error fetching stock data for {stock.get('ticker', 'unknown')}: {e}")
                continue
        return results
    except Exception as e:
        print(f"Error in get_top_stocks: {e}")
        import traceback
        print(traceback.format_exc())
        return []

def get_economic_pulse(country: str) -> dict:
    """Get full economic pulse for a country."""
    meta = COUNTRY_ECONOMIC_DATA.get(country)
    if not meta:
        print(f"No economic data mapping found for country: {country}")
        return {"currency_code": None, "currency": None, "stock": None}
    
    print(f"Fetching economics for {country}: currency={meta['currency']}, index={meta['index']}")
    
    currency = None
    if meta["currency"]:
        currency = get_exchange_rate(meta["currency"])
        if currency:
            print(f"Currency data retrieved: {currency.get('formatted')}")
        else:
            print(f"Failed to retrieve currency data for {meta['currency']}")
    
    stock = None
    if meta["index"]:
        stock = get_stock_index(meta["index"], meta["index_name"])
        if stock:
            print(f"Stock data retrieved: {stock.get('formatted')}")
        else:
            print(f"Failed to retrieve stock data for {meta['index']}")
    
    result = {
        "currency_code": meta["currency"],
        "currency": currency,
        "stock": stock,
    }
    print(f"Economic pulse result for {country}: {result}")
    return result
