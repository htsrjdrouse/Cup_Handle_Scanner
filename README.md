# Cup_Handle_Scanner

# 🥤 Cup & Handle Stock Scanner

A powerful stock pattern scanner that detects Cup & Handle, Ascending Triangle, and Bull Flag patterns using William O'Neil's CANSLIM methodology. Includes technical analysis, DCF valuation estimates, and market sentiment analysis.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.12+-green.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)

## ✨ Features

### Pattern Detection
- **🥤 Cup & Handle** — Classic William O'Neil pattern with U-shaped cup and consolidation handle
- **📐 Ascending Triangle** — Flat resistance with rising support trendline
- **🚩 Bull Flag** — Strong pole surge followed by tight consolidation

### Technical Analysis
- **RSI (14)** — Relative Strength Index with overbought/oversold zones
- **MACD** — Moving Average Convergence Divergence with signal crossovers
- **ADX** — Average Directional Index for trend strength
- **SMA 50/200** — Moving averages with Golden Cross detection
- **Volume Analysis** — Volume spike detection and ratio tracking

### Valuation & Signals
- **DCF Valuation** — Intrinsic value estimates with margin of safety
- **Breakout Criteria Checklist** — Validates entry signals against 8+ criteria
- **Risk/Reward Calculation** — Buy point, stop loss, and target prices
- **Signal Scoring** — 0-100 composite score for entry quality

### 📈 Options Strategy: Bull Call Spread (NEW!)
- **Automated Trade Suggestions** — When viewing any stock chart, get a ready-to-execute Bull Call Spread recommendation
- **Smart Strike Selection** — Automatically selects ATM/ITM call to buy and 5-10% OTM call to sell
- **45-90 Day Expirations** — Filters for optimal time decay balance
- **Position Sizing** — Calculates contracts based on your budget ($150-$1000)
- **Complete P/L Analysis** — Breakeven, max gain, max loss, and R/R ratio
- **Exit Rules** — 50%/100% profit targets, stop loss, and time-based exit
- **IV Assessment** — Evaluates implied volatility and adjusts recommendations
- **Signal Integration** — Ties into pattern strength for STRONG/MODERATE/SPECULATIVE signals

### Market Scanning
- **S&P 500** — Scan all 500 large-cap stocks
- **NASDAQ** — All NASDAQ stocks with $1B+ market cap
- **NYSE** — All NYSE stocks with $1B+ market cap
- **All US** — Combined scan of 2000+ stocks

### Data Sources
- Yahoo Finance API for price data
- NASDAQ API for market tickers
- Reddit & StockTwits for sentiment (optional)

## 🚀 Quick Start

### Option 1: Standalone Python Scanner (Simplest)

```bash
cd /path/to/stocks

# Install dependencies
pip install -r requirements.txt

# Run the scanner
python cup_handle_scanner_2.py
```

Access at **http://127.0.0.1:5002**

### Option 2: Full-Stack App (React + Node.js)

```bash
cd cup_scanner

# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd ../frontend
npm install
npm run dev
```

Access at **http://localhost:3000** (frontend) and **http://localhost:3005** (API)

### Option 3: Docker

```bash
# Standalone Python scanner
docker-compose up -d

# Or full-stack app
cd cup_scanner
docker-compose up -d
```

## 📖 Usage

### Single Stock Scan

Search for any ticker to get:
- Pattern detection with visual chart markers
- Technical indicators dashboard
- Breakout criteria checklist
- DCF valuation with margin of safety
- Price chart with pattern overlay

### Market Scan

Click "Scan S&P 500", "Scan NASDAQ", or "Scan All US" to:
- Scan hundreds/thousands of stocks
- Filter to only those with detected patterns
- Sort by status (STRONG BUY → BUY → FORMING → WATCH)
- Click any result to view detailed analysis

## 🎯 Pattern Criteria

### Cup & Handle (William O'Neil Style)
| Criteria | Valid Range |
|----------|-------------|
| Cup Depth | 12-35% |
| Cup Duration | 20-130 days |
| Rim Difference | < 5% |
| Handle Pullback | 2-15% |
| U-Shape Score | Higher = better |

### Breakout Validation
- ✅ Price above buy point (right rim + $0.10)
- ✅ Above 50-day SMA
- ✅ Above 200-day SMA
- ✅ RSI between 50-70
- ✅ Volume spike (1.5x+ average)
- ✅ MACD bullish
- ✅ Bullish candle pattern

### Signal Scoring
| Score | Status |
|-------|--------|
| 70+ | STRONG BUY |
| 50-69 | BUY |
| < 50 | WATCH / FORMING |

## 📈 Options Strategy: Bull Call Spread

When viewing any stock's chart (e.g., `/chart/AAPL`), you'll see a Bull Call Spread recommendation designed for bullish patterns with less capital and built-in risk management.

### Why Bull Call Spreads?
- **Lower cost** than buying shares or naked calls (typically 30-50% less)
- **Defined risk** — max loss is capped at the net debit paid
- **Reduced IV exposure** — spread structure minimizes implied volatility crush
- **Works well with patterns** — complements cup & handle, bull flag, and ascending triangle setups

### Trade Parameters

| Parameter | Target | Rationale |
|-----------|--------|-----------|
| **Expiration** | 45-90 days | Time for pattern to resolve without excessive theta decay |
| **Buy Strike** | ATM to 2% ITM | Delta ~0.55-0.70 for moderate moves |
| **Sell Strike** | 5-10% OTM | Delta ~0.30-0.40 to finance the trade |
| **Budget** | $150-$1000 | Adjustable via URL parameter `?budget=500` |
| **Contracts** | 1-3 max | Scaled to budget |

### Exit Rules (Built In)

| Rule | Target |
|------|--------|
| **50% Profit** | Close at 1.5x net debit |
| **100% Profit** | Close at 2x net debit |
| **Stop Loss** | Close at 50% of net debit |
| **Pattern Stop** | Close if stock drops below handle low |
| **Time Stop** | Exit 21 days before expiration |

### Signal Strength Integration

| Pattern Score | Options Recommendation |
|---------------|------------------------|
| 75+ | STRONG — Full position (2-3 contracts) |
| 55-74 | MODERATE — Conservative (1-2 contracts) |
| < 55 | SPECULATIVE — 1 contract only |

### Extended Stock Warning

When breakeven requires >5% move, you'll see a warning suggesting to wait for a pullback to the handle before entering.

## 🔌 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with feature list |
| GET | `/api/search?q=AAPL` | Search stocks by symbol or name |
| GET | `/api/scan/:symbol` | Full analysis for single stock |
| GET | `/api/scan?market=sp500` | Bulk scan a market |
| GET | `/api/history/:symbol` | Price history with pattern markers |
| GET | `/api/company/:symbol` | Company info and fundamentals |
| GET | `/api/sentiment/:symbol` | Market sentiment analysis |
| GET | `/api/tickers/:market` | Get ticker list for a market |

### Example Response

```json
{
  "symbol": "AAPL",
  "currentPrice": 185.50,
  "status": "FORMING",
  "score": 72.5,
  "patterns": {
    "cupAndHandle": {
      "cupDepthPct": 22.3,
      "cupLengthDays": 65,
      "handleDeclinePct": 8.1,
      "leftRimPrice": 180.00,
      "rightRimPrice": 182.50,
      "bottomPrice": 142.00
    }
  },
  "indicators": {
    "rsi": 58.2,
    "adx": 24.5,
    "sma50": 178.30,
    "sma200": 172.15,
    "macdBullish": true
  },
  "dcfValue": 195.00,
  "marginOfSafety": 5.1,
  "criteria": {
    "aboveSMA50": true,
    "aboveSMA200": true,
    "volumeSpike": false
  },
  "signalScore": 65
}
```

## 📁 Project Structure

```
stocks/
├── cup_handle_scanner_2.py   # Standalone Python scanner (Flask)
├── requirements.txt          # Python dependencies
├── Dockerfile                # Python container
├── docker-compose.yml        # Python service
│
└── cup_scanner/              # Full-stack application
    ├── backend/
    │   ├── src/
    │   │   └── index.ts      # Express API + pattern detection
    │   ├── package.json
    │   └── Dockerfile
    │
    ├── frontend/
    │   ├── src/
    │   │   ├── App.tsx       # React UI with Recharts
    │   │   └── main.tsx
    │   ├── package.json
    │   ├── vite.config.ts
    │   └── Dockerfile
    │
    ├── python_backend/       # Alternative Python backend
    │   └── app.py
    │
    └── docker-compose.yml    # Full stack services
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5002 (Python) / 3005 (Node) | API server port |
| `PYTHONUNBUFFERED` | 1 | Enable real-time Python logs |

### Customizing Scan Parameters

Edit pattern detection thresholds in the scanner code:

```python
# cup_handle_scanner_2.py
MIN_CUP_DAYS = 20
MAX_CUP_DAYS = 130
MIN_CUP_DEPTH = 12  # percent
MAX_CUP_DEPTH = 35  # percent
MIN_HANDLE_DECLINE = 2  # percent
MAX_HANDLE_DECLINE = 15  # percent
```

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## 📚 References

- [William O'Neil - How to Make Money in Stocks](https://www.amazon.com/How-Make-Money-Stocks-Winning/dp/0071614133)
- [IBD Cup with Handle Pattern](https://www.investors.com/how-to-invest/investors-corner/the-basics-how-to-analyze-a-stocks-cup-with-handle/)
- [CANSLIM Investment Strategy](https://www.investopedia.com/terms/c/canslim.asp)

## ⚠️ Disclaimer

This tool is for **educational and research purposes only**. It is not financial advice. Pattern detection is probabilistic and past performance does not guarantee future results. Always do your own research and consult a financial advisor before making investment decisions.

## 📄 License

MIT License - feel free to use, modify, and distribute.

---

Built with ☕ and 📈 by a growth investor who got tired of manually drawing cup patterns.
