#!/usr/bin/env python3
"""
Simple DCF Calculator - Called by Node.js backend
Usage: python3 dcf_calc.py <SYMBOL>
Output: JSON with DCF data
"""

import sys
import json
import yfinance as yf

def format_market_cap(value):
    if abs(value) >= 1e12:
        return f"${value/1e12:.2f}T"
    elif abs(value) >= 1e9:
        return f"${value/1e9:.2f}B"
    elif abs(value) >= 1e6:
        return f"${value/1e6:.2f}M"
    else:
        return f"${value:.0f}"

def calculate_dcf_value(symbol):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        
        # Get free cash flow
        cashflow = ticker.cashflow
        if cashflow is None or cashflow.empty:
            return {'status': 'no_data', 'dcf_value': None, 'margin': None}
        
        # Find Free Cash Flow
        fcf = None
        fcf_history = []
        
        for row_name in ['Free Cash Flow', 'FreeCashFlow']:
            if row_name in cashflow.index:
                fcf_row = cashflow.loc[row_name]
                fcf = fcf_row.iloc[0] if len(fcf_row) > 0 else None
                fcf_history = fcf_row.tolist()[:4]
                break
        
        if fcf is None:
            # Try to calculate: Operating Cash Flow - CapEx
            ocf = None
            capex = None
            for row_name in ['Operating Cash Flow', 'Total Cash From Operating Activities']:
                if row_name in cashflow.index:
                    ocf = cashflow.loc[row_name].iloc[0]
                    break
            for row_name in ['Capital Expenditure', 'Capital Expenditures']:
                if row_name in cashflow.index:
                    capex = abs(cashflow.loc[row_name].iloc[0])
                    break
            if ocf is not None and capex is not None:
                fcf = ocf - capex
            else:
                return {'status': 'no_fcf', 'dcf_value': None, 'margin': None}
        
        if fcf is None or fcf <= 0:
            return {'status': 'negative_fcf', 'dcf_value': '-FCF', 'margin': None}
        
        # Get shares outstanding
        shares = info.get('sharesOutstanding', None)
        if not shares:
            return {'status': 'no_shares', 'dcf_value': None, 'margin': None}
        
        # DCF parameters
        growth_rate = 0.10  # 10% growth for 5 years
        terminal_growth = 0.03  # 3% terminal growth
        discount_rate = 0.10  # 10% discount rate
        years = 5
        
        # Project future cash flows
        projected_fcf = []
        current_fcf = fcf
        for year in range(1, years + 1):
            current_fcf = current_fcf * (1 + growth_rate)
            discounted = current_fcf / ((1 + discount_rate) ** year)
            projected_fcf.append(discounted)
        
        # Terminal value
        terminal_fcf = current_fcf * (1 + terminal_growth)
        terminal_value = terminal_fcf / (discount_rate - terminal_growth)
        discounted_terminal = terminal_value / ((1 + discount_rate) ** years)
        
        # Total intrinsic value
        total_value = sum(projected_fcf) + discounted_terminal
        intrinsic_per_share = total_value / shares
        
        # Get current price
        current_price = info.get('currentPrice', info.get('regularMarketPrice', None))
        
        result = {
            'status': 'success',
            'dcf_value': round(intrinsic_per_share, 2),
            'fcf': fcf,
            'fcf_fmt': format_market_cap(fcf),
            'shares': shares,
        }
        
        if current_price:
            margin_of_safety = ((intrinsic_per_share - current_price) / current_price) * 100
            result['current_price'] = current_price
            result['margin'] = round(margin_of_safety, 1)
        
        return result
        
    except Exception as e:
        return {'status': 'error', 'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: python3 dcf_calc.py <SYMBOL>'}))
        sys.exit(1)
    
    symbol = sys.argv[1].upper()
    result = calculate_dcf_value(symbol)
    print(json.dumps(result))
