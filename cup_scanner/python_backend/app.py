# Python Flask Backend for Cup & Handle Scanner
# Uses yfinance for reliable data fetching
# Serves JSON APIs for React frontend

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
import pandas_ta as ta
from datetime import datetime, timedelta
from scipy.signal import argrelextrema
import numpy as np
import sys
import os

# Add the stocks directory to path to import from cup_handle_scanner_2
sys.path.insert(0, '/Users/richard/Documents/stocks')

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# ═══════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════

SP500_TICKERS = [
    "AAPL", "ABBV", "ABT", "ACN", "ADBE", "ADI", "ADM", "ADP", "ADSK", "AMD", "AMGN", "AMZN",
    "ANET", "ANSS", "AON", "APD", "APH", "AVGO", "AXP", "BA", "BAC", "BDX", "BIIB", "BK",
    "BKNG", "BLK", "BMY", "BRK.B", "BSX", "C", "CAT", "CB", "CCI", "CDNS", "CHTR", "CI",
    "CL", "CMCSA", "CME", "CMG", "COP", "COST", "CRM", "CSCO", "CSX", "CVS", "CVX", "D",
    "DE", "DHR", "DIS", "DUK", "EA", "ECL", "EL", "EMR", "EOG", "EQIX", "EW", "EXC", "F",
    "FDX", "FIS", "GILD", "GM", "GOOG", "GOOGL", "GPN", "GS", "HD", "HON", "IBM", "ICE",
    "INTC", "INTU", "ISRG", "ITW", "JNJ", "JPM", "KO", "LIN", "LLY", "LMT", "LOW", "MA",
    "MCD", "MDLZ", "MDT", "MET", "META", "MMC", "MMM", "MO", "MRK", "MS", "MSFT", "NEE",
    "NFLX", "NKE", "NOW", "NSC", "NVDA", "ORCL", "PEP", "PFE", "PG", "PGR", "PLD", "PM",
    "PNC", "PYPL", "QCOM", "REGN", "RTX", "SBUX", "SCHW", "SHW", "SLB", "SO", "SPGI", "SYK",
    "T", "TGT", "TJX", "TMO", "TMUS", "TSLA", "TXN", "UNH", "UNP", "UPS", "USB", "V", "VZ",
    "WBA", "WFC", "WMT", "XOM", "ZTS"
]

# ═══════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def format_market_cap(value):
    if not value or value == 0:
        return 'N/A'
    if value >= 1e12:
        return f"${value/1e12:.2f}T"
    elif value >= 1e9:
        return f"${value/1e9:.2f}B"
    elif value >= 1e6:
        return f"${value/1e6:.2f}M"
    return f"${value:,.0f}"

def get_company_info(symbol):
    """Get detailed company information using yfinance."""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        return {
            'symbol': symbol,
            'companyName': info.get('longName', info.get('shortName', symbol)),
            'sector': info.get('sector', 'Unknown'),
            'industry': info.get('industry', 'Unknown'),
            'exchange': info.get('exchange', 'Unknown'),
            'marketCap': info.get('marketCap', None),
            'marketCapFmt': format_market_cap(info.get('marketCap', 0)),
            'businessSummary': info.get('longBusinessSummary', 'No description available.'),
            'website': info.get('website', None),
            'employees': info.get('fullTimeEmployees', None),
            'country': info.get('country', 'Unknown'),
            'currentPrice': info.get('currentPrice', info.get('regularMarketPrice', None)),
            'previousClose': info.get('previousClose', None),
            'fiftyTwoWeekHigh': info.get('fiftyTwoWeekHigh', None),
            'fiftyTwoWeekLow': info.get('fiftyTwoWeekLow', None),
            'avgVolume': info.get('averageVolume', None),
            'peRatio': info.get('trailingPE', None),
            'forwardPE': info.get('forwardPE', None),
            'dividend': f"{info.get('dividendYield', 0) * 100:.2f}%" if info.get('dividendYield') else None,
            'beta': info.get('beta', None),
            'eps': info.get('trailingEps', None),
            'targetMeanPrice': info.get('targetMeanPrice', None),
            'recommendationKey': info.get('recommendationKey', None),
        }
    except Exception as e:
        print(f"Error getting company info for {symbol}: {e}")
        return {
            'symbol': symbol,
            'companyName': symbol,
            'sector': 'Unknown',
            'industry': 'Unknown',
            'businessSummary': 'Unable to fetch company information.',
            'error': str(e)
        }

def detect_cup_and_handle(df, min_cup_days=20, max_cup_days=130):
    """Detect cup and handle pattern."""
    if len(df) < max_cup_days + 30:
        return None

    closes = df['Close'].values
    highs = df['High'].values
    lows = df['Low'].values

    order = 10
    local_max_idx = argrelextrema(closes, np.greater_equal, order=order)[0]
    local_min_idx = argrelextrema(closes, np.less_equal, order=order)[0]

    if len(local_max_idx) < 2 or len(local_min_idx) < 1:
        return None

    lookback = min(len(closes), max_cup_days + 50)
    recent_max = [i for i in local_max_idx if i >= len(closes) - lookback]
    recent_min = [i for i in local_min_idx if i >= len(closes) - lookback]

    if len(recent_max) < 2 or len(recent_min) < 1:
        return None

    best_pattern = None
    best_score = 0

    for i, left_rim_idx in enumerate(recent_max[:-1]):
        for right_rim_idx in recent_max[i+1:]:
            cup_length = right_rim_idx - left_rim_idx

            if cup_length < min_cup_days or cup_length > max_cup_days:
                continue

            bottom_candidates = [m for m in recent_min if left_rim_idx < m < right_rim_idx]
            if not bottom_candidates:
                continue

            bottom_idx = min(bottom_candidates, key=lambda x: closes[x])

            left_rim_price = closes[left_rim_idx]
            right_rim_price = closes[right_rim_idx]
            bottom_price = closes[bottom_idx]

            avg_rim = (left_rim_price + right_rim_price) / 2
            cup_depth_pct = (avg_rim - bottom_price) / avg_rim * 100

            if cup_depth_pct < 12 or cup_depth_pct > 35:
                continue

            rim_diff = abs(left_rim_price - right_rim_price) / avg_rim * 100
            if rim_diff > 5:
                continue

            handle_start = right_rim_idx
            handle_data = closes[handle_start:]

            if len(handle_data) < 5:
                continue

            handle_low = min(handle_data)
            handle_decline = (right_rim_price - handle_low) / right_rim_price * 100

            if handle_decline < 2 or handle_decline > 15:
                continue

            # Calculate symmetry
            left_days = bottom_idx - left_rim_idx
            right_days = right_rim_idx - bottom_idx
            symmetry = 1 - abs(left_days - right_days) / cup_length

            score = 100 - abs(cup_depth_pct - 25) - rim_diff - abs(handle_decline - 8) + symmetry * 20

            if score > best_score:
                best_score = score
                best_pattern = {
                    'leftRimIdx': int(left_rim_idx),
                    'rightRimIdx': int(right_rim_idx),
                    'bottomIdx': int(bottom_idx),
                    'leftRimPrice': float(left_rim_price),
                    'rightRimPrice': float(right_rim_price),
                    'bottomPrice': float(bottom_price),
                    'cupDepthPct': float(cup_depth_pct),
                    'cupLengthDays': int(cup_length),
                    'handleLow': float(handle_low),
                    'handleDeclinePct': float(handle_decline),
                    'symmetryPct': float(symmetry * 100),
                    'score': float(score)
                }

    return best_pattern

def check_breakout_criteria(df, pattern):
    """Validate breakout criteria."""
    if pattern is None:
        return None, {}

    last = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else last

    resistance = pattern['rightRimPrice']
    buy_point = resistance + 0.10
    current_price = float(last['Close'])

    # Calculate indicators
    df = df.copy()
    df['SMA50'] = df['Close'].rolling(50).mean()
    df['SMA200'] = df['Close'].rolling(200).mean()
    df['RSI'] = ta.rsi(df['Close'], length=14)

    macd = ta.macd(df['Close'], fast=12, slow=26, signal=9)
    if macd is not None:
        df['MACD'] = macd['MACD_12_26_9']
        df['MACD_signal'] = macd['MACDs_12_26_9']
    
    last = df.iloc[-1]
    prev = df.iloc[-2] if len(df) > 1 else last

    sma50 = float(last['SMA50']) if not pd.isna(last['SMA50']) else None
    sma200 = float(last['SMA200']) if not pd.isna(last['SMA200']) else None
    rsi = float(last['RSI']) if not pd.isna(last['RSI']) else None
    macd_val = float(last['MACD']) if 'MACD' in last and not pd.isna(last['MACD']) else None
    macd_sig = float(last['MACD_signal']) if 'MACD_signal' in last and not pd.isna(last['MACD_signal']) else None

    # Volume analysis
    handle_start = pattern['rightRimIdx']
    if handle_start < len(df) - 1:
        handle_volumes = df['Volume'].iloc[handle_start:-1]
        avg_handle_vol = handle_volumes.mean() if len(handle_volumes) > 0 else df['Volume'].mean()
    else:
        avg_handle_vol = df['Volume'].rolling(20).mean().iloc[-1]

    current_vol = float(last['Volume'])
    vol_ratio = current_vol / avg_handle_vol if avg_handle_vol > 0 else 1

    criteria = {
        'breakoutConfirmed': current_price > buy_point,
        'aboveSMA50': current_price > sma50 if sma50 else False,
        'aboveSMA200': current_price > sma200 if sma200 else False,
        'rsiHealthy': 50 <= rsi <= 70 if rsi else False,
        'rsiAcceptable': 45 <= rsi <= 75 if rsi else False,
        'volumeSpike': vol_ratio > 1.5,
        'macdBullish': (macd_val > macd_sig) if (macd_val and macd_sig) else False,
    }

    # Signal score
    signal_score = sum([
        criteria['breakoutConfirmed'] * 25,
        criteria['aboveSMA50'] * 15,
        criteria['aboveSMA200'] * 15,
        criteria['rsiHealthy'] * 10,
        criteria['volumeSpike'] * 15,
        criteria['macdBullish'] * 10,
    ])

    # Status
    if criteria['breakoutConfirmed'] and criteria['aboveSMA50'] and criteria['aboveSMA200']:
        if signal_score >= 70:
            status = "STRONG BUY"
        elif signal_score >= 50:
            status = "BUY"
        else:
            status = "WATCH"
    elif not criteria['breakoutConfirmed'] and current_price > resistance * 0.97:
        status = "FORMING - NEAR BREAKOUT"
    elif not criteria['breakoutConfirmed']:
        status = "FORMING"
    else:
        status = "WATCH"

    return {
        'buyPoint': round(buy_point, 2),
        'currentPrice': round(current_price, 2),
        'resistance': round(resistance, 2),
        'sma50': round(sma50, 2) if sma50 else None,
        'sma200': round(sma200, 2) if sma200 else None,
        'rsi': round(rsi, 1) if rsi else None,
        'volumeRatio': round(vol_ratio, 2),
        'criteria': criteria,
        'signalScore': signal_score,
        'status': status,
    }, criteria

def calculate_dcf_value(symbol):
    """Calculate DCF intrinsic value."""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        hist = ticker.history(period="5y")
        
        if len(hist) < 252:
            return None
            
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        if not current_price:
            return None
            
        # Calculate historical growth
        yearly_returns = hist['Close'].resample('Y').last().pct_change().dropna()
        avg_growth = yearly_returns.mean() if len(yearly_returns) > 0 else 0.05
        
        # Conservative growth estimate
        growth_rate = min(max(avg_growth * 0.7, 0.02), 0.25)
        discount_rate = 0.10
        terminal_growth = 0.02
        projection_years = 5
        
        # Simple DCF
        dcf_value = current_price
        for year in range(1, projection_years + 1):
            dcf_value *= (1 + growth_rate) / (1 + discount_rate)
        
        # Terminal value
        terminal_value = dcf_value * (1 + terminal_growth) / (discount_rate - terminal_growth)
        terminal_value_pv = terminal_value / ((1 + discount_rate) ** projection_years)
        
        intrinsic_value = dcf_value + terminal_value_pv * 0.3
        margin_of_safety = ((intrinsic_value - current_price) / current_price) * 100
        
        return {
            'dcfValue': round(intrinsic_value, 2),
            'currentPrice': round(current_price, 2),
            'marginOfSafety': round(margin_of_safety, 1),
            'estimatedGrowth': round(growth_rate * 100, 1),
            'discountRate': discount_rate * 100,
            'valuationStatus': 'Undervalued' if margin_of_safety > 10 else ('Overvalued' if margin_of_safety < -10 else 'Fair Value')
        }
    except Exception as e:
        print(f"DCF calculation error for {symbol}: {e}")
        return None

# ═══════════════════════════════════════════════════════════════
# API ROUTES
# ═══════════════════════════════════════════════════════════════

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'backend': 'python-flask',
        'dataSource': 'yfinance',
        'tickers': len(SP500_TICKERS)
    })

@app.route('/api/search')
def search():
    query = request.args.get('q', '').upper().strip()
    if not query:
        return jsonify({'results': []})
    
    try:
        # Search using yfinance
        results = []
        
        # Check if exact match in S&P 500
        matching = [t for t in SP500_TICKERS if t.startswith(query)][:10]
        
        for symbol in matching:
            try:
                ticker = yf.Ticker(symbol)
                info = ticker.info
                results.append({
                    'symbol': symbol,
                    'name': info.get('longName', info.get('shortName', symbol)),
                    'exchange': info.get('exchange', 'Unknown'),
                    'type': 'EQUITY'
                })
            except:
                results.append({
                    'symbol': symbol,
                    'name': symbol,
                    'exchange': 'Unknown',
                    'type': 'EQUITY'
                })
        
        return jsonify({'query': query, 'results': results})
    except Exception as e:
        return jsonify({'query': query, 'results': [], 'error': str(e)})

@app.route('/api/company/<symbol>')
def company(symbol):
    symbol = symbol.upper()
    info = get_company_info(symbol)
    return jsonify(info)

@app.route('/api/scan/<symbol>')
def scan_symbol(symbol):
    symbol = symbol.upper()
    
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="1y")
        
        if df.empty or len(df) < 150:
            return jsonify({'error': 'Insufficient data', 'symbol': symbol}), 404
        
        # Detect pattern
        pattern = detect_cup_and_handle(df)
        
        # Get breakout criteria
        if pattern:
            breakout, criteria = check_breakout_criteria(df, pattern)
        else:
            breakout = {
                'currentPrice': float(df['Close'].iloc[-1]),
                'status': 'WATCH',
                'signalScore': 0,
                'criteria': {},
                'sma50': float(df['Close'].rolling(50).mean().iloc[-1]) if len(df) >= 50 else None,
                'sma200': float(df['Close'].rolling(200).mean().iloc[-1]) if len(df) >= 200 else None,
            }
            criteria = {}
        
        # Calculate DCF
        dcf = calculate_dcf_value(symbol)
        
        return jsonify({
            'symbol': symbol,
            'currentPrice': breakout.get('currentPrice'),
            'status': breakout.get('status', 'WATCH'),
            'score': pattern['score'] if pattern else 0,
            'patterns': {
                'cupAndHandle': pattern
            },
            'patternCount': 1 if pattern else 0,
            'indicators': {
                'sma50': breakout.get('sma50'),
                'sma200': breakout.get('sma200'),
                'rsi': breakout.get('rsi'),
                'volumeRatio': breakout.get('volumeRatio'),
                'aboveSMA50': criteria.get('aboveSMA50', False),
                'aboveSMA200': criteria.get('aboveSMA200', False),
                'macdBullish': criteria.get('macdBullish', False),
                'buyPoint': breakout.get('buyPoint', 0),
                'stopLoss': pattern['handleLow'] if pattern else 0,
                'target': pattern['rightRimPrice'] + (pattern['rightRimPrice'] - pattern['bottomPrice']) if pattern else 0,
            },
            'criteria': criteria,
            'signalScore': breakout.get('signalScore', 0),
            'dcfValue': dcf['dcfValue'] if dcf else None,
            'marginOfSafety': dcf['marginOfSafety'] if dcf else None,
            'valuationStatus': dcf['valuationStatus'] if dcf else None,
            'scannedAt': datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Scan error for {symbol}: {e}")
        return jsonify({'error': str(e), 'symbol': symbol}), 500

@app.route('/api/scan')
def scan_market():
    market = request.args.get('market', 'sp500').lower()
    limit = int(request.args.get('limit', 500))
    
    tickers = SP500_TICKERS[:limit]
    results = []
    
    print(f"Scanning {len(tickers)} stocks...")
    
    for i, symbol in enumerate(tickers):
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period="1y")
            
            if df.empty or len(df) < 150:
                continue
            
            pattern = detect_cup_and_handle(df)
            
            if not pattern:
                continue
            
            breakout, criteria = check_breakout_criteria(df, pattern)
            dcf = calculate_dcf_value(symbol)
            
            results.append({
                'symbol': symbol,
                'currentPrice': breakout.get('currentPrice'),
                'status': breakout.get('status', 'FORMING'),
                'score': pattern['score'],
                'patterns': {'cupAndHandle': pattern},
                'cupDepth': f"{pattern['cupDepthPct']:.1f}",
                'cupDays': pattern['cupLengthDays'],
                'handlePullback': f"{pattern['handleDeclinePct']:.1f}",
                'rsi': breakout.get('rsi'),
                'volumeRatio': breakout.get('volumeRatio'),
                'aboveSMA50': criteria.get('aboveSMA50', False),
                'aboveSMA200': criteria.get('aboveSMA200', False),
                'macdBullish': criteria.get('macdBullish', False),
                'buyPoint': breakout.get('buyPoint'),
                'stopLoss': pattern['handleLow'],
                'target': pattern['rightRimPrice'] + (pattern['rightRimPrice'] - pattern['bottomPrice']),
                'dcfValue': dcf['dcfValue'] if dcf else None,
                'marginOfSafety': dcf['marginOfSafety'] if dcf else None,
                'criteria': criteria,
                'signalScore': breakout.get('signalScore', 0),
            })
            
            if (i + 1) % 10 == 0:
                print(f"Scanned {i + 1}/{len(tickers)}, found {len(results)} patterns")
                
        except Exception as e:
            print(f"Error scanning {symbol}: {e}")
            continue
    
    # Sort by score
    results.sort(key=lambda x: (-['STRONG BUY', 'BUY', 'FORMING - NEAR BREAKOUT', 'FORMING', 'WATCH'].index(x['status']) if x['status'] in ['STRONG BUY', 'BUY', 'FORMING - NEAR BREAKOUT', 'FORMING', 'WATCH'] else 5, -x['score']))
    
    return jsonify({
        'market': market.upper(),
        'scanned': len(tickers),
        'found': len(results),
        'results': results
    })

@app.route('/api/history/<symbol>')
def history(symbol):
    symbol = symbol.upper()
    
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="1y")
        
        if df.empty:
            return jsonify({'error': 'No data'}), 404
        
        # Detect pattern for markers
        pattern = detect_cup_and_handle(df)
        
        data = []
        for i, (date, row) in enumerate(df.iterrows()):
            data.append({
                'date': date.strftime('%b %d'),
                'fullDate': date.strftime('%Y-%m-%d'),
                'price': float(row['Close']),
                'volume': int(row['Volume']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'open': float(row['Open']),
                'index': i
            })
        
        # Pattern markers
        pattern_markers = None
        if pattern:
            offset = len(df) - len(data) if len(df) > len(data) else 0
            left_idx = pattern['leftRimIdx'] - offset
            bottom_idx = pattern['bottomIdx'] - offset
            right_idx = pattern['rightRimIdx'] - offset
            
            if 0 <= left_idx < len(data) and 0 <= right_idx < len(data):
                pattern_markers = {
                    'leftRim': {'index': left_idx, 'date': data[left_idx]['date'], 'price': pattern['leftRimPrice']},
                    'bottom': {'index': bottom_idx, 'date': data[bottom_idx]['date'], 'price': pattern['bottomPrice']},
                    'rightRim': {'index': right_idx, 'date': data[right_idx]['date'], 'price': pattern['rightRimPrice']},
                    'handleLow': {'price': pattern['handleLow']},
                    'target': pattern['rightRimPrice'] + (pattern['rightRimPrice'] - pattern['bottomPrice']),
                    'cupDepthPct': pattern['cupDepthPct'],
                    'cupLengthDays': pattern['cupLengthDays'],
                }
        
        return jsonify({
            'symbol': symbol,
            'data': data,
            'totalDays': len(data),
            'patternMarkers': pattern_markers
        })
    except Exception as e:
        print(f"History error for {symbol}: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🐍 Python Flask Backend for Cup & Handle Scanner")
    print("Using yfinance for reliable data")
    print("API running on http://localhost:3005")
    app.run(host='0.0.0.0', port=3005, debug=True)
