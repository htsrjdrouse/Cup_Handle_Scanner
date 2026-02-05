import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine, ComposedChart, Scatter, Cell, ReferenceArea, ReferenceDot } from 'recharts';

interface ScanResult {
  symbol: string;
  currentPrice: number;
  patterns: {
    cupAndHandle: any;
    ascendingTriangle: any;
    bullFlag: any;
  };
  patternCount: number;
  status: string;
  score: number;
  dcfValue: number | null;
  marginOfSafety: number | null;
  dcfStatus?: string;
  valuationStatus?: string;
  indicators?: any;
  criteria?: {
    breakoutConfirmed: boolean;
    aboveSMA50: boolean;
    aboveSMA200: boolean;
    rsiHealthy: boolean;
    rsiAcceptable: boolean;
    volumeSpike: boolean;
    macdBullish: boolean;
    macdCrossover: boolean;
    bullishCandle: boolean;
  };
  signalScore?: number;
  details?: {
    growthBasedValue: number;
    maBasedValue: number;
    historicalAvgValue: number;
    estimatedGrowthRate: number;
    discountRate: number;
    projectionYears: number;
  };
  returns?: {
    oneMonth: number;
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
  };
  movingAverages?: {
    sma50: number;
    sma200: number;
    priceVsSMA50: number;
    priceVsSMA200: number;
    aboveSMA50: boolean;
    aboveSMA200: boolean;
    goldenCross: boolean;
  };
  scannedAt: string;
}

interface MarketResult {
  symbol: string;
  currentPrice: number;
  status: string;
  score: number;
  cupDepth: string;
  cupDays: number | string;
  handlePullback: string;
  patternCount: number;
  dcfValue: number | null;
  marginOfSafety: number | null;
  patterns?: {
    cupAndHandle: any;
    ascendingTriangle: any;
    bullFlag: any;
  };
  ascTriangle?: any;
  bullFlag?: any;
  buyPoint?: number;
  stopLoss?: number;
  target?: number;
  rrRatio?: number;
  uShape?: string;
  symmetry?: number;
  rsi?: number;
  adx?: number;
  volumeRatio?: number;
  aboveSMA50?: boolean;
  aboveSMA200?: boolean;
  macdBullish?: boolean;
}

interface ScanResponse {
  market: string;
  scanned: number;
  found: number;
  results: MarketResult[];
}

interface CompanyInfo {
  symbol: string;
  companyName: string;
  exchange: string;
  market: string;
  sector: string;
  industry: string;
  businessSummary: string;
  website: string | null;
  employees: number | null;
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  dividend: string | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  targetMeanPrice?: number | null;
  recommendationKey?: string | null;
}

interface SentimentData {
  symbol: string;
  overallSentiment: string;
  sentimentScore: number;
  priceMomentum: number;
  volumeStrength: string;
  redditMentions: number;
  twitterMentions: number;
  newsSentiment: string;
  lastUpdated: string;
}

interface ChartData {
  date: string;
  price: number;
  volume: number;
  high?: number;
  low?: number;
  open?: number;
  index?: number;
  marker?: string;
}

interface PatternMarkers {
  leftRim: { index: number; date: string; price: number };
  bottom: { index: number; date: string; price: number };
  rightRim: { index: number; date: string; price: number };
  handleLow: { index: number; price: number };
  target: number;
  cupDepthPct: number;
  cupLengthDays: number;
  handleDeclinePct: number;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

const API_BASE = '/api';

export default function App() {
  const [symbol, setSymbol] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [marketResults, setMarketResults] = useState<MarketResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [marketScanning, setMarketScanning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'market'>('single');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [patternMarkers, setPatternMarkers] = useState<PatternMarkers | null>(null);
  
  // Search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleSearchInput = (value: string) => {
    setSymbol(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.results || []);
          setShowDropdown(data.results && data.results.length > 0);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const selectSearchResult = (result: SearchResult) => {
    setSymbol(result.symbol);
    setShowDropdown(false);
    viewDetail(result.symbol);
  };

  const scanSymbol = async () => {
    if (!symbol.trim()) return;
    
    setLoading(true);
    setResult(null);
    setChartData([]);
    setCompanyInfo(null);
    setSentiment(null);
    setSelectedSymbol(null);
    setShowDropdown(false);
    
    try {
      const response = await fetch(`${API_BASE}/scan/${symbol}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setSelectedSymbol(symbol.toUpperCase());
        
        // Also fetch additional data
        await Promise.all([
          fetchCompanyInfo(symbol),
          fetchSentiment(symbol),
          fetchHistory(symbol)
        ]);
      } else {
        alert('Symbol not found or no data available');
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to scan symbol');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyInfo = async (sym: string) => {
    try {
      const response = await fetch(`${API_BASE}/company/${sym}`);
      if (response.ok) {
        const info = await response.json();
        setCompanyInfo(info);
      }
    } catch (error) {
      console.error('Company info error:', error);
    }
  };

  const fetchSentiment = async (sym: string) => {
    try {
      const response = await fetch(`${API_BASE}/sentiment/${sym}`);
      if (response.ok) {
        const sent = await response.json();
        setSentiment(sent);
      }
    } catch (error) {
      console.error('Sentiment error:', error);
    }
  };

  const fetchHistory = async (sym: string) => {
    try {
      const response = await fetch(`${API_BASE}/history/${sym}`);
      if (response.ok) {
        const hist = await response.json();
        if (hist.data) {
          setChartData(hist.data);
        }
        if (hist.patternMarkers) {
          setPatternMarkers(hist.patternMarkers);
        } else {
          setPatternMarkers(null);
        }
      }
    } catch (error) {
      console.error('History error:', error);
    }
  };

  const viewDetail = async (sym: string) => {
    setSelectedSymbol(sym.toUpperCase());
    setActiveTab('single');
    setDetailLoading(true);
    setSymbol(sym.toUpperCase());
    
    try {
      const [scanRes, companyRes, sentimentRes, histRes] = await Promise.all([
        fetch(`${API_BASE}/scan/${sym}`),
        fetch(`${API_BASE}/company/${sym}`),
        fetch(`${API_BASE}/sentiment/${sym}`),
        fetch(`${API_BASE}/history/${sym}`)
      ]);
      
      if (scanRes.ok) {
        const data = await scanRes.json();
        setResult(data);
      }
      
      if (companyRes.ok) {
        const info = await companyRes.json();
        setCompanyInfo(info);
      }
      
      if (sentimentRes.ok) {
        const sent = await sentimentRes.json();
        setSentiment(sent);
      }
      
      if (histRes.ok) {
        const hist = await histRes.json();
        if (hist.data) {
          setChartData(hist.data);
        }
      }
    } catch (error) {
      console.error('Detail fetch error:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const goBackToList = () => {
    setSelectedSymbol(null);
    setResult(null);
    setChartData([]);
    setCompanyInfo(null);
    setSentiment(null);
    setActiveTab('market');
  };

  const scanMarket = async (market: string) => {
    setMarketScanning(market);
    setMarketResults([]);
    
    try {
      const response = await fetch(`${API_BASE}/scan?market=${market}&limit=500`);
      if (response.ok) {
        const data: ScanResponse = await response.json();
        setMarketResults(data.results);
      }
    } catch (error) {
      console.error('Market scan error:', error);
      alert('Failed to scan market');
    } finally {
      setMarketScanning(null);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'STRONG BUY': return 'status-strong-buy';
      case 'BUY': return 'status-buy';
      case 'FORMING': return 'status-forming';
      default: return 'status-watch';
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatNumber = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '-';
    if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
    return value.toLocaleString();
  };

  const formatDCFCellColor = (margin: number | null) => {
    if (margin === null) return '';
    if (margin > 20) return 'dcf-green';
    if (margin > 0) return 'dcf-lightgreen';
    if (margin > -20) return 'dcf-orange';
    return 'dcf-red';
  };

  const formatSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Bullish': return '#22c55e';
      case 'Bearish': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const calculateRiskReward = (cup: any, currentPrice: number) => {
    if (!cup) return '-';
    const buyPoint = cup.rightRimPrice;
    const stopLoss = cup.handleLow;
    const target = cup.rightRimPrice + (cup.rightRimPrice - cup.bottomPrice);
    const risk = buyPoint - stopLoss;
    const reward = target - buyPoint;
    if (risk <= 0) return '-';
    const rr = reward / risk;
    return `${rr.toFixed(1)}:1`;
  };

  return (
    <div className="container">
      <header>
        <h1>🥤 Cup & Handle Scanner</h1>
        <p>Pattern detection & DCF valuation for stocks</p>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'single' ? 'active' : ''} 
          onClick={() => setActiveTab('single')}
        >
          Single Stock
        </button>
        <button 
          className={activeTab === 'market' ? 'active' : ''} 
          onClick={() => setActiveTab('market')}
        >
          Market Scan
        </button>
      </div>

      {activeTab === 'single' && (
        <div className="single-section">
          <div className="search-box" ref={searchRef}>
            <div className="search-input-wrapper">
              <input
                type="text"
                value={symbol}
                onChange={(e) => handleSearchInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowDropdown(false);
                    scanSymbol();
                  }
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                placeholder="Search stocks (e.g., AAPL, Microsoft, Tesla...)"
              />
              {searchLoading && <span className="search-spinner">⏳</span>}
              
              {showDropdown && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="search-item"
                      onClick={() => selectSearchResult(item)}
                    >
                      <span className="search-symbol">{item.symbol}</span>
                      <span className="search-name">{item.name}</span>
                      <span className="search-exchange">{item.exchange}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={scanSymbol} disabled={loading}>
              {loading ? 'Scanning...' : 'Scan'}
            </button>
          </div>

          {detailLoading && (
            <div className="loading">Loading details...</div>
          )}

          {selectedSymbol && !detailLoading && result && (
            <div className="result-card">
              {marketResults.length > 0 && (
                <button className="back-btn" onClick={goBackToList}>← Back to List</button>
              )}
              <div className="result-header">
                <div>
                  <h2>{selectedSymbol}</h2>
                  {companyInfo && (
                    <p className="company-name">{companyInfo.companyName}</p>
                  )}
                </div>
                <div className="header-right">
                  <span className={`status-badge ${getStatusClass(result.status)}`}>
                    {result.status}
                  </span>
                  <span className="score-badge">Score: {result.score.toFixed(0)}</span>
                </div>
              </div>

              <div className="price-section">
                <span className="current-price">{formatCurrency(result.currentPrice)}</span>
                {companyInfo?.targetMeanPrice && (
                  <span className="target-price">
                    Target: {formatCurrency(companyInfo.targetMeanPrice)}
                    {companyInfo.recommendationKey && (
                      <span className={`recommendation ${companyInfo.recommendationKey}`}>
                        {companyInfo.recommendationKey.toUpperCase()}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {companyInfo && (
                <div className="company-section">
                  <h3>🏢 Company Info</h3>
                  <div className="company-grid">
                    <div className="company-main">
                      <p className="business-summary">{companyInfo.businessSummary}</p>
                      <div className="company-meta">
                        <span><strong>Sector:</strong> {companyInfo.sector}</span>
                        <span><strong>Industry:</strong> {companyInfo.industry}</span>
                        {companyInfo.website && (
                          <a href={companyInfo.website} target="_blank" rel="noopener noreferrer">
                            Website ↗
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="company-stats">
                      <div className="stat-item">
                        <span className="label">Market Cap</span>
                        <span className="value">{formatNumber(companyInfo.marketCap)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">P/E Ratio</span>
                        <span className="value">{companyInfo.peRatio?.toFixed(1) || '-'}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">EPS</span>
                        <span className="value">{formatCurrency(companyInfo.eps)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">Dividend</span>
                        <span className="value">{companyInfo.dividend || '-'}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">52W High</span>
                        <span className="value">{formatCurrency(companyInfo.fiftyTwoWeekHigh)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="label">52W Low</span>
                        <span className="value">{formatCurrency(companyInfo.fiftyTwoWeekLow)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {chartData.length > 0 && result && (
                <div className="chart-section">
                  <h3>📈 Price Chart (1 Year)</h3>
                  {patternMarkers && (
                    <div className="pattern-info-bar">
                      <span className="pattern-label">🥤 Cup & Handle Detected:</span>
                      <span className="pattern-detail">Left Rim: {patternMarkers.leftRim.date}</span>
                      <span className="pattern-detail">Bottom: {patternMarkers.bottom.date}</span>
                      <span className="pattern-detail">Right Rim: {patternMarkers.rightRim.date}</span>
                      <span className="pattern-detail">Cup: {patternMarkers.cupLengthDays} days, {patternMarkers.cupDepthPct.toFixed(1)}% deep</span>
                    </div>
                  )}
                  <div className="chart-legend">
                    {(result.patterns?.cupAndHandle || patternMarkers) && (
                      <>
                        <span className="legend-item"><span className="legend-dot" style={{background: '#f59e0b'}}></span>Left Rim</span>
                        <span className="legend-item"><span className="legend-dot" style={{background: '#ef4444'}}></span>Cup Bottom</span>
                        <span className="legend-item"><span className="legend-dot" style={{background: '#22c55e'}}></span>Right Rim (Buy Point)</span>
                        <span className="legend-item"><span className="legend-dot" style={{background: '#8b5cf6'}}></span>Handle Low (Stop)</span>
                        <span className="legend-item"><span className="legend-color" style={{background: '#3b82f6'}}></span>Target</span>
                      </>
                    )}
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={350}>
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          interval="preserveStartEnd"
                          tickCount={10}
                        />
                        <YAxis 
                          yAxisId="price" 
                          domain={['auto', 'auto']} 
                          stroke="#94a3b8" 
                          fontSize={10}
                          tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />
                        <YAxis 
                          yAxisId="volume" 
                          orientation="right" 
                          domain={[0, 'auto']} 
                          stroke="#94a3b8" 
                          fontSize={10}
                          tickFormatter={(value) => `${(value / 1e6).toFixed(0)}M`}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          formatter={(value: number, name: string) => [
                            name === 'price' ? formatCurrency(value) : (value / 1e6).toFixed(2) + 'M',
                            name === 'price' ? 'Price' : 'Volume'
                          ]}
                        />
                        <Area 
                          yAxisId="price"
                          type="monotone" 
                          dataKey="price" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          fillOpacity={0.15} 
                          strokeWidth={2}
                          name="price"
                        />
                        <Bar 
                          yAxisId="volume" 
                          dataKey="volume" 
                          fill="#475569" 
                          opacity={0.5}
                          name="volume" 
                        />
                        
                        {/* Cup & Handle Pattern - Shaded Area and Markers */}
                        {patternMarkers && (
                          <>
                            {/* Shaded area showing cup formation period */}
                            <ReferenceArea
                              yAxisId="price"
                              x1={chartData[patternMarkers.leftRim.index]?.date}
                              x2={chartData[patternMarkers.rightRim.index]?.date}
                              fill="#3b82f6"
                              fillOpacity={0.1}
                            />
                            
                            {/* Pattern point markers */}
                            <ReferenceDot
                              yAxisId="price"
                              x={chartData[patternMarkers.leftRim.index]?.date}
                              y={patternMarkers.leftRim.price}
                              r={8}
                              fill="#f59e0b"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                            <ReferenceDot
                              yAxisId="price"
                              x={chartData[patternMarkers.bottom.index]?.date}
                              y={patternMarkers.bottom.price}
                              r={8}
                              fill="#ef4444"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                            <ReferenceDot
                              yAxisId="price"
                              x={chartData[patternMarkers.rightRim.index]?.date}
                              y={patternMarkers.rightRim.price}
                              r={8}
                              fill="#22c55e"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                            
                            {/* Target line */}
                            <ReferenceLine 
                              yAxisId="price"
                              y={patternMarkers.target} 
                              stroke="#3b82f6" 
                              strokeDasharray="5 5"
                              strokeWidth={2}
                              label={{ value: `Target $${patternMarkers.target.toFixed(0)}`, fill: '#3b82f6', fontSize: 10 }}
                            />
                            
                            {/* Stop loss line */}
                            <ReferenceLine 
                              yAxisId="price"
                              y={patternMarkers.handleLow.price} 
                              stroke="#8b5cf6" 
                              strokeDasharray="3 3"
                              strokeWidth={1}
                              label={{ value: `Stop $${patternMarkers.handleLow.price.toFixed(0)}`, fill: '#8b5cf6', fontSize: 10 }}
                            />
                          </>
                        )}
                        
                        {/* Fallback to old method if no patternMarkers but pattern exists */}
                        {!patternMarkers && result.patterns?.cupAndHandle && (
                          <>
                            <ReferenceLine 
                              yAxisId="price"
                              y={result.patterns.cupAndHandle.rightRimPrice} 
                              stroke="#22c55e" 
                              strokeDasharray="5 5"
                              strokeWidth={2}
                              label={{ value: 'Buy Point', fill: '#22c55e', fontSize: 10 }}
                            />
                            <ReferenceLine 
                              yAxisId="price"
                              y={result.patterns.cupAndHandle.bottomPrice} 
                              stroke="#ef4444" 
                              strokeDasharray="3 3"
                              strokeWidth={2}
                              label={{ value: 'Bottom', fill: '#ef4444', fontSize: 10 }}
                            />
                            <ReferenceLine 
                              yAxisId="price"
                              y={result.patterns.cupAndHandle.rightRimPrice + (result.patterns.cupAndHandle.rightRimPrice - result.patterns.cupAndHandle.bottomPrice)} 
                              stroke="#3b82f6" 
                              strokeDasharray="5 5"
                              strokeWidth={2}
                              label={{ value: 'Target', fill: '#3b82f6', fontSize: 10 }}
                            />
                          </>
                        )}
                        
                        {result.patterns?.ascendingTriangle && (
                          <ReferenceLine 
                            yAxisId="price"
                            y={result.patterns.ascendingTriangle.resistance} 
                            stroke="#a855f7" 
                            strokeDasharray="5 5"
                            label={{ value: 'Resistance', fill: '#a855f7', fontSize: 10 }}
                          />
                        )}
                        
                        {result.patterns?.bullFlag && result.patterns.bullFlag.target && (
                          <ReferenceLine 
                            yAxisId="price"
                            y={result.patterns.bullFlag.target} 
                            stroke="#f97316" 
                            strokeDasharray="5 5"
                            label={{ value: 'Flag Target', fill: '#f97316', fontSize: 10 }}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {result.indicators && (
                <div className="indicators-section">
                  <h3>📊 Technical Indicators</h3>
                  <div className="indicators-grid">
                    <div className="indicator-item">
                      <span className="label">RSI (14)</span>
                      <span className={`value ${result.indicators.rsi > 70 ? 'overbought' : result.indicators.rsi < 30 ? 'oversold' : ''}`}>
                        {result.indicators.rsi?.toFixed(1) || '-'}
                      </span>
                    </div>
                    <div className="indicator-item">
                      <span className="label">ADX</span>
                      <span className="value">{result.indicators.adx?.toFixed(1) || '-'}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="label">Vol Ratio</span>
                      <span className="value">{result.indicators.volumeRatio?.toFixed(2) || '-'}x</span>
                    </div>
                    <div className="indicator-item">
                      <span className="label">SMA 50</span>
                      <span className="value">{formatCurrency(result.indicators.sma50)}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="label">SMA 200</span>
                      <span className="value">{formatCurrency(result.indicators.sma200)}</span>
                    </div>
                    <div className="indicator-item">
                      <span className="label">Above SMA50</span>
                      <span className={`value ${result.indicators.aboveSMA50 ? 'bullish' : 'bearish'}`}>
                        {result.indicators.aboveSMA50 ? '✔' : '✘'}
                      </span>
                    </div>
                    <div className="indicator-item">
                      <span className="label">Above SMA200</span>
                      <span className={`value ${result.indicators.aboveSMA200 ? 'bullish' : 'bearish'}`}>
                        {result.indicators.aboveSMA200 ? '✔' : '✘'}
                      </span>
                    </div>
                    <div className="indicator-item">
                      <span className="label">MACD</span>
                      <span className={`value ${result.indicators.macdBullish ? 'bullish' : result.indicators.macdBullish === false ? 'bearish' : ''}`}>
                        {result.indicators.macdBullish ? '✔ Bullish' : result.indicators.macdBullish === false ? '✘ Bearish' : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {result.patterns.cupAndHandle && (
                <div className="pattern-detail-section">
                  <h3>🥤 Cup & Handle Formation</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="label">Cup Depth</span>
                      <span className="value">{result.patterns.cupAndHandle.cupDepthPct?.toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Cup Duration</span>
                      <span className="value">{result.patterns.cupAndHandle.cupLengthDays} days</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Left Rim</span>
                      <span className="value">{formatCurrency(result.patterns.cupAndHandle.leftRimPrice)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Right Rim (Buy)</span>
                      <span className="value buy-point">{formatCurrency(result.patterns.cupAndHandle.rightRimPrice)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Cup Bottom</span>
                      <span className="value">{formatCurrency(result.patterns.cupAndHandle.bottomPrice)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Symmetry</span>
                      <span className="value">{result.patterns.cupAndHandle.symmetryPct?.toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Handle Pullback</span>
                      <span className="value">{result.patterns.cupAndHandle.handleDeclinePct?.toFixed(1)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Stop Loss</span>
                      <span className="value stop-loss">{formatCurrency(result.patterns.cupAndHandle.handleLow)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Target</span>
                      <span className="value target">{formatCurrency(result.patterns.cupAndHandle.rightRimPrice + (result.patterns.cupAndHandle.rightRimPrice - result.patterns.cupAndHandle.bottomPrice))}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Risk:Reward</span>
                      <span className="value">{calculateRiskReward(result.patterns.cupAndHandle, result.currentPrice)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="other-patterns">
                {result.patterns.ascendingTriangle && (
                  <div className="pattern-card triangle">
                    <h3>📐 Ascending Triangle</h3>
                    <p>Resistance: {formatCurrency(result.patterns.ascendingTriangle.resistance)}</p>
                    <p>Score: {result.patterns.ascendingTriangle.score}</p>
                  </div>
                )}
                {result.patterns.bullFlag && (
                  <div className="pattern-card flag">
                    <h3>🚩 Bull Flag</h3>
                    <p>Pole Gain: +{result.patterns.bullFlag.poleGain?.toFixed(1)}%</p>
                    <p>Target: {formatCurrency(result.patterns.bullFlag.target)}</p>
                  </div>
                )}
              </div>

              {!result.patterns.cupAndHandle && !result.patterns.ascendingTriangle && !result.patterns.bullFlag && (
                <p className="no-patterns">No patterns detected for this stock</p>
              )}

              {/* Breakout Criteria Checklist */}
              {result.criteria && (
                <div className="criteria-section">
                  <h3>✅ Breakout Criteria Checklist</h3>
                  <div className="criteria-grid">
                    <div className={`criteria-item ${result.criteria.breakoutConfirmed ? 'pass' : 'fail'}`}>
                      <span className="icon">{result.criteria.breakoutConfirmed ? '✔' : '✘'}</span>
                      <span className="text">Breakout Confirmed (Price &gt; Buy Point)</span>
                    </div>
                    <div className={`criteria-item ${result.criteria.aboveSMA50 ? 'pass' : 'fail'}`}>
                      <span className="icon">{result.criteria.aboveSMA50 ? '✔' : '✘'}</span>
                      <span className="text">Above 50-day SMA</span>
                    </div>
                    <div className={`criteria-item ${result.criteria.aboveSMA200 ? 'pass' : 'fail'}`}>
                      <span className="icon">{result.criteria.aboveSMA200 ? '✔' : '✘'}</span>
                      <span className="text">Above 200-day SMA</span>
                    </div>
                    <div className={`criteria-item ${result.criteria.rsiHealthy ? 'pass' : 'fail'}`}>
                      <span className="icon">{result.criteria.rsiHealthy ? '✔' : '✘'}</span>
                      <span className="text">RSI 50-70 (Healthy Momentum)</span>
                    </div>
                    <div className={`criteria-item ${result.criteria.volumeSpike ? 'pass' : 'fail'}`}>
                      <span className="icon">{result.criteria.volumeSpike ? '✔' : '✘'}</span>
                      <span className="text">Volume Spike (1.5x+ Average)</span>
                    </div>
                    <div className={`criteria-item ${result.criteria.macdBullish ? 'pass' : 'fail'}`}>
                      <span className="icon">{result.criteria.macdBullish ? '✔' : '✘'}</span>
                      <span className="text">MACD Bullish</span>
                    </div>
                    <div className={`criteria-item ${result.criteria.macdCrossover ? 'pass' : 'fail'}`}>
                      <span className="icon">{result.criteria.macdCrossover ? '✔' : '✘'}</span>
                      <span className="text">MACD Crossover (Recent)</span>
                    </div>
                    <div className={`criteria-item ${result.criteria.bullishCandle ? 'pass' : 'fail'}`}>
                      <span className="icon">{result.criteria.bullishCandle ? '✔' : '✘'}</span>
                      <span className="text">Bullish Candle Pattern</span>
                    </div>
                  </div>
                  {result.signalScore !== undefined && (
                    <div className="signal-score">
                      <span>Signal Score: </span>
                      <span className={result.signalScore >= 70 ? 'high' : result.signalScore >= 50 ? 'medium' : 'low'}>
                        {result.signalScore}/100
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="dcf-section">
                <h3>💰 DCF Valuation</h3>
                <div className="dcf-grid">
                  <div className="dcf-item">
                    <span className="label">Intrinsic Value</span>
                    <span className="value">{result.dcfValue ? formatCurrency(result.dcfValue) : 'N/A'}</span>
                  </div>
                  <div className="dcf-item">
                    <span className="label">Current Price</span>
                    <span className="value">{formatCurrency(result.currentPrice)}</span>
                  </div>
                  <div className="dcf-item">
                    <span className="label">Margin of Safety</span>
                    <span className="value" style={{ color: result.marginOfSafety !== null && result.marginOfSafety > 0 ? '#22c55e' : '#ef4444' }}>
                      {result.marginOfSafety !== null ? `${result.marginOfSafety > 0 ? '+' : ''}${result.marginOfSafety.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="dcf-item">
                    <span className="label">Valuation</span>
                    <span className="value" style={{ 
                      color: result.marginOfSafety !== null && result.marginOfSafety > 20 ? '#22c55e' : 
                             result.marginOfSafety !== null && result.marginOfSafety > 0 ? '#84cc16' :
                             result.marginOfSafety !== null && result.marginOfSafety > -20 ? '#f59e0b' : '#ef4444'
                    }}>
                      {result.marginOfSafety !== null ? (
                        result.marginOfSafety > 20 ? 'Undervalued' :
                        result.marginOfSafety > 0 ? 'Slightly Undervalued' :
                        result.marginOfSafety > -20 ? 'Slightly Overvalued' : 'Overvalued'
                      ) : 'N/A'}
                    </span>
                  </div>
                </div>
                
                {/* Returns Summary */}
                {result.returns && (
                  <div className="returns-section">
                    <h4>📈 Returns</h4>
                    <div className="returns-grid">
                      <div className="return-item">
                        <span className="label">1 Month</span>
                        <span className={`value ${result.returns.oneMonth >= 0 ? 'positive' : 'negative'}`}>
                          {result.returns.oneMonth >= 0 ? '+' : ''}{result.returns.oneMonth}%
                        </span>
                      </div>
                      <div className="return-item">
                        <span className="label">3 Month</span>
                        <span className={`value ${result.returns.threeMonth >= 0 ? 'positive' : 'negative'}`}>
                          {result.returns.threeMonth >= 0 ? '+' : ''}{result.returns.threeMonth}%
                        </span>
                      </div>
                      <div className="return-item">
                        <span className="label">6 Month</span>
                        <span className={`value ${result.returns.sixMonth >= 0 ? 'positive' : 'negative'}`}>
                          {result.returns.sixMonth >= 0 ? '+' : ''}{result.returns.sixMonth}%
                        </span>
                      </div>
                      <div className="return-item">
                        <span className="label">1 Year</span>
                        <span className={`value ${result.returns.oneYear >= 0 ? 'positive' : 'negative'}`}>
                          {result.returns.oneYear >= 0 ? '+' : ''}{result.returns.oneYear}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Moving Averages */}
                {result.movingAverages && (
                  <div className="ma-section">
                    <h4>📊 Moving Averages</h4>
                    <div className="ma-grid">
                      <div className="ma-item">
                        <span className="label">SMA 50</span>
                        <span className="value">{formatCurrency(result.movingAverages.sma50)}</span>
                        <span className={`diff ${result.movingAverages.priceVsSMA50 >= 0 ? 'positive' : 'negative'}`}>
                          ({result.movingAverages.priceVsSMA50 >= 0 ? '+' : ''}{result.movingAverages.priceVsSMA50}%)
                        </span>
                      </div>
                      <div className="ma-item">
                        <span className="label">SMA 200</span>
                        <span className="value">{formatCurrency(result.movingAverages.sma200)}</span>
                        <span className={`diff ${result.movingAverages.priceVsSMA200 >= 0 ? 'positive' : 'negative'}`}>
                          ({result.movingAverages.priceVsSMA200 >= 0 ? '+' : ''}{result.movingAverages.priceVsSMA200}%)
                        </span>
                      </div>
                      <div className="ma-item">
                        <span className="label">Golden Cross</span>
                        <span className={`value ${result.movingAverages.goldenCross ? 'positive' : 'negative'}`}>
                          {result.movingAverages.goldenCross ? '✔ Yes (SMA50 > SMA200)' : '✘ No'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {sentiment && (
                <div className="sentiment-section">
                  <h3>📱 Market Sentiment</h3>
                  <div className="sentiment-grid">
                    <div className="sentiment-item">
                      <span className="label">Overall</span>
                      <span className="value" style={{ color: formatSentimentColor(sentiment.overallSentiment) }}>
                        {sentiment.overallSentiment}
                      </span>
                    </div>
                    <div className="sentiment-item">
                      <span className="label">Score</span>
                      <span className="value">{sentiment.sentimentScore}/100</span>
                    </div>
                    <div className="sentiment-item">
                      <span className="label">Price Momentum</span>
                      <span className="value" style={{ color: sentiment.priceMomentum > 0 ? '#22c55e' : '#ef4444' }}>
                        {sentiment.priceMomentum > 0 ? '+' : ''}{sentiment.priceMomentum}%
                      </span>
                    </div>
                    <div className="sentiment-item">
                      <span className="label">Volume</span>
                      <span className="value">{sentiment.volumeStrength}</span>
                    </div>
                    <div className="sentiment-item">
                      <span className="label">News</span>
                      <span className="value" style={{ color: formatSentimentColor(sentiment.newsSentiment) }}>
                        {sentiment.newsSentiment}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'market' && (
        <div className="market-section">
          <div className="market-buttons">
            <button 
              onClick={() => scanMarket('sp500')} 
              disabled={marketScanning !== null}
            >
              {marketScanning === 'sp500' ? 'Scanning S&P 500...' : 'Scan S&P 500'}
            </button>
            <button 
              onClick={() => scanMarket('nasdaq')} 
              disabled={marketScanning !== null}
            >
              {marketScanning === 'nasdaq' ? 'Scanning NASDAQ...' : 'Scan NASDAQ'}
            </button>
            <button 
              onClick={() => scanMarket('all')} 
              disabled={marketScanning !== null}
            >
              {marketScanning === 'all' ? 'Scanning All US...' : 'Scan All US'}
            </button>
          </div>

          {marketResults.length > 0 && (
            <div className="market-results">
              <p className="results-count">Found {marketResults.length} patterns</p>
              <div className="table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>View</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Price</th>
                      <th>Patterns</th>
                      <th>Cup Analysis</th>
                      <th>RSI</th>
                      <th>ADX</th>
                      <th>Vol</th>
                      <th>SMA50</th>
                      <th>MACD</th>
                      <th>Stop</th>
                      <th>Target</th>
                      <th>R:R</th>
                      <th>DCF</th>
                      <th>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketResults.map((item, idx) => (
                      <tr key={idx}>
                        <td className="symbol">{item.symbol}</td>
                        <td>
                          <button className="view-btn" onClick={() => viewDetail(item.symbol)}>
                            View
                          </button>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.score.toFixed(0)}</td>
                        <td>{formatCurrency(item.currentPrice)}</td>
                        <td className="patterns-cell">
                          {item.patterns?.cupAndHandle && <span className="pattern-icon cup" title="Cup & Handle">🥤</span>}
                          {item.ascTriangle && <span className="pattern-icon triangle" title="Ascending Triangle">📐</span>}
                          {item.bullFlag && <span className="pattern-icon flag" title="Bull Flag">🚩</span>}
                          {!item.patterns?.cupAndHandle && !item.ascTriangle && !item.bullFlag && '-'}
                        </td>
                        <td className="cup-analysis">
                          {item.cupDepth !== '-' && (
                            <>
                              Depth: {item.cupDepth}%<br/>
                              {item.cupDays}d<br/>
                              Handle: {item.handlePullback}%
                            </>
                          )}
                          {item.cupDepth === '-' && '-'}
                        </td>
                        <td>{item.rsi?.toFixed(1) || '-'}</td>
                        <td>{item.adx?.toFixed(1) || '-'}</td>
                        <td>{item.volumeRatio?.toFixed(2) || '-'}x</td>
                        <td className={item.aboveSMA50 ? 'check' : 'cross'}>{item.aboveSMA50 ? '✔' : '✘'}</td>
                        <td className={item.macdBullish ? 'check' : 'cross'}>{item.macdBullish ? '✔' : '✘'}</td>
                        <td>{formatCurrency(item.stopLoss)}</td>
                        <td>{formatCurrency(item.target)}</td>
                        <td>{item.rrRatio ? `${item.rrRatio.toFixed(1)}:1` : '-'}</td>
                        <td className={formatDCFCellColor(item.marginOfSafety)}>
                          {item.dcfValue ? formatCurrency(item.dcfValue) : '-'}
                        </td>
                        <td className={formatDCFCellColor(item.marginOfSafety)}>
                          {item.marginOfSafety !== null ? `${item.marginOfSafety.toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0f172a;
          color: #e2e8f0;
          min-height: 100vh;
        }
        .container { max-width: 1600px; margin: 0 auto; padding: 30px 20px; }
        header { text-align: center; margin-bottom: 30px; }
        header h1 { font-size: 2rem; color: #38bdf8; margin-bottom: 8px; }
        header p { color: #94a3b8; }
        
        .tabs { display: flex; gap: 10px; margin-bottom: 24px; justify-content: center; }
        .tabs button {
          padding: 12px 30px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tabs button:hover { background: #334155; }
        .tabs button.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        
        .search-box { display: flex; gap: 12px; margin-bottom: 30px; justify-content: center; }
        .search-input-wrapper { position: relative; width: 400px; }
        .search-input-wrapper input {
          padding: 14px 20px;
          width: 100%;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          color: white;
          font-size: 1.1rem;
        }
        .search-input-wrapper input:focus { outline: none; border-color: #3b82f6; }
        .search-spinner { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); }
        
        .search-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          margin-top: 4px;
          max-height: 300px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .search-item {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #334155;
        }
        .search-item:last-child { border-bottom: none; }
        .search-item:hover { background: #334155; }
        .search-symbol { font-weight: 600; color: #38bdf8; min-width: 60px; }
        .search-name { flex: 1; color: #e2e8f0; font-size: 0.9rem; }
        .search-exchange { color: #64748b; font-size: 0.75rem; }
        
        .search-box button {
          padding: 14px 30px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .search-box button:hover:not(:disabled) { transform: scale(1.02); }
        .search-box button:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .loading { text-align: center; padding: 40px; color: #94a3b8; }
        
        .result-card {
          background: #1e293b;
          border-radius: 12px;
          padding: 24px;
          padding-top: 60px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          position: relative;
        }
        .result-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .result-header h2 { font-size: 2rem; color: white; }
        .company-name { color: #94a3b8; font-size: 0.9rem; margin-top: 4px; }
        .header-right { display: flex; gap: 12px; align-items: center; }
        .score-badge { background: #334155; padding: 6px 12px; border-radius: 16px; font-size: 0.85rem; }
        
        .status-badge {
          padding: 6px 12px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 0.85rem;
        }
        .status-strong-buy { background: #16a34a; color: white; }
        .status-buy { background: #22c55e; color: white; }
        .status-forming { background: #f59e0b; color: black; }
        .status-watch { background: #64748b; color: white; }
        
        .back-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          padding: 8px 16px;
          background: #334155;
          border: none;
          border-radius: 6px;
          color: #94a3b8;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .back-btn:hover { background: #475569; color: white; }
        
        .price-section { margin-bottom: 24px; display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; }
        .current-price { font-size: 2.5rem; font-weight: 700; color: #22c55e; }
        .target-price { color: #94a3b8; font-size: 1rem; }
        .recommendation { margin-left: 8px; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
        .recommendation.buy, .recommendation.strong_buy { background: #22c55e; color: white; }
        .recommendation.hold { background: #f59e0b; color: black; }
        .recommendation.sell, .recommendation.strong_sell { background: #ef4444; color: white; }
        
        .chart-section { margin-bottom: 24px; padding: 20px; background: #0f172a; border-radius: 8px; }
        .chart-section h3 { margin-bottom: 12px; color: #38bdf8; }
        .pattern-info-bar { background: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; border-radius: 6px; padding: 10px 16px; margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
        .pattern-info-bar .pattern-label { font-weight: 600; color: #3b82f6; }
        .pattern-info-bar .pattern-detail { font-size: 0.85rem; color: #94a3b8; }
        .legend-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
        .chart-legend { display: flex; gap: 16px; margin-bottom: 12px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #94a3b8; }
        .legend-color { width: 16px; height: 3px; border-radius: 2px; }
        .chart-container { height: 350px; }
        
        .company-section { margin-bottom: 24px; padding: 20px; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border: 1px solid #8b5cf6; }
        .company-section h3 { margin-bottom: 16px; color: #8b5cf6; }
        .company-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
        @media (max-width: 900px) { .company-grid { grid-template-columns: 1fr; } }
        .business-summary { color: #e2e8f0; line-height: 1.6; margin-bottom: 16px; font-size: 0.9rem; }
        .company-meta { display: flex; gap: 16px; flex-wrap: wrap; font-size: 0.85rem; color: #94a3b8; }
        .company-meta a { color: #3b82f6; text-decoration: none; }
        .company-meta a:hover { text-decoration: underline; }
        .company-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .stat-item { background: #0f172a; padding: 12px; border-radius: 6px; }
        .stat-item .label { display: block; font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
        .stat-item .value { font-size: 1rem; font-weight: 600; }
        
        .dcf-section, .sentiment-section { margin-bottom: 24px; padding: 20px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border: 1px solid #22c55e; }
        .dcf-section h3, .sentiment-section h3 { margin-bottom: 16px; color: #22c55e; }
        .dcf-grid, .sentiment-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 16px; }
        .dcf-item, .sentiment-item { display: flex; flex-direction: column; gap: 4px; }
        .dcf-item .label, .sentiment-item .label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; }
        .dcf-item .value, .sentiment-item .value { font-size: 1.1rem; font-weight: 600; }
        
        .pattern-detail-section { margin-bottom: 24px; padding: 20px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid #3b82f6; }
        .pattern-detail-section h3 { margin-bottom: 16px; color: #3b82f6; }
        .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
        .detail-item { display: flex; justify-content: space-between; padding: 8px 12px; background: #0f172a; border-radius: 6px; }
        .detail-item .label { color: #94a3b8; font-size: 0.8rem; }
        .detail-item .value { font-weight: 600; }
        .detail-item .buy-point { color: #22c55e; }
        .detail-item .stop-loss { color: #ef4444; }
        .detail-item .target { color: #3b82f6; }
        
        .other-patterns { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .pattern-card { padding: 16px; border-radius: 8px; }
        .pattern-card.triangle { background: rgba(168, 85, 247, 0.1); border: 1px solid #a855f7; }
        .pattern-card.flag { background: rgba(249, 115, 22, 0.1); border: 1px solid #f97316; }
        .pattern-card h3 { margin-bottom: 12px; font-size: 1rem; }
        .pattern-card p { font-size: 0.85rem; color: #94a3b8; margin: 4px 0; }
        
        .no-patterns { text-align: center; color: #64748b; padding: 40px; background: #1e293b; border-radius: 8px; margin-bottom: 24px; }
        
        .market-buttons { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .market-buttons button {
          padding: 14px 24px;
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .market-buttons button:hover:not(:disabled) { background: #334155; color: white; }
        .market-buttons button:disabled { opacity: 0.6; cursor: not-allowed; }
        
        .results-count { margin-bottom: 16px; color: #94a3b8; }
        
        .table-wrapper { overflow-x: auto; }
        .results-table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; font-size: 0.8rem; }
        .results-table th, .results-table td { padding: 8px 6px; text-align: center; border-bottom: 1px solid #334155; white-space: nowrap; }
        .results-table th { background: #0f172a; color: #94a3b8; font-weight: 600; font-size: 0.7rem; text-transform: uppercase; position: sticky; top: 0; }
        .results-table td { color: #e2e8f0; }
        .results-table .symbol { font-weight: 600; color: #38bdf8; }
        .results-table .cup-analysis { font-size: 0.7rem; text-align: left; line-height: 1.3; }
        .results-table .patterns-cell { font-size: 1.2rem; }
        .results-table tr:hover { background: #273549; }
        .results-table .check { color: #22c55e; }
        .results-table .cross { color: #ef4444; }
        
        .view-btn {
          padding: 4px 8px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.7rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .view-btn:hover { background: #2563eb; }
        
        .pattern-icon { margin: 0 2px; }
        
        .dcf-green { background: rgba(34, 197, 94, 0.3); color: #22c55e; }
        .dcf-lightgreen { background: rgba(132, 204, 22, 0.3); color: #84cc16; }
        .dcf-orange { background: rgba(245, 158, 11, 0.3); color: #f59e0b; }
        .dcf-red { background: rgba(239, 68, 68, 0.3); color: #ef4444; }
        
        .indicators-section { margin-bottom: 24px; padding: 20px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid #3b82f6; }
        .indicators-section h3 { margin-bottom: 16px; color: #3b82f6; }
        .indicators-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }
        .indicator-item { display: flex; justify-content: space-between; padding: 8px 12px; background: #0f172a; border-radius: 6px; }
        .indicator-item .label { color: #94a3b8; font-size: 0.8rem; }
        .indicator-item .value { font-weight: 600; }
        .indicator-item .value.bullish { color: #22c55e; }
        .indicator-item .value.bearish { color: #ef4444; }
        .indicator-item .value.overbought { color: #ef4444; }
        .indicator-item .value.oversold { color: #22c55e; }
        
        /* Criteria Section */
        .criteria-section { margin-bottom: 24px; padding: 20px; background: rgba(249, 115, 22, 0.1); border-radius: 8px; border: 1px solid #f97316; }
        .criteria-section h3 { margin-bottom: 16px; color: #f97316; }
        .criteria-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px; }
        .criteria-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #0f172a; border-radius: 6px; }
        .criteria-item .icon { font-size: 1.1rem; width: 24px; }
        .criteria-item .text { font-size: 0.85rem; }
        .criteria-item.pass .icon { color: #22c55e; }
        .criteria-item.fail .icon { color: #ef4444; }
        .criteria-item.pass { border-left: 3px solid #22c55e; }
        .criteria-item.fail { border-left: 3px solid #ef4444; }
        .signal-score { margin-top: 16px; text-align: center; font-size: 1.1rem; }
        .signal-score .high { color: #22c55e; font-weight: 700; font-size: 1.3rem; }
        .signal-score .medium { color: #f59e0b; font-weight: 700; font-size: 1.3rem; }
        .signal-score .low { color: #ef4444; font-weight: 700; font-size: 1.3rem; }
        
        /* Returns Section */
        .returns-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid #334155; }
        .returns-section h4 { margin-bottom: 12px; color: #94a3b8; font-size: 0.9rem; }
        .returns-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .return-item { text-align: center; padding: 8px; background: #0f172a; border-radius: 6px; }
        .return-item .label { display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 4px; }
        .return-item .value { font-weight: 600; font-size: 1rem; }
        .return-item .value.positive { color: #22c55e; }
        .return-item .value.negative { color: #ef4444; }
        
        /* MA Section */
        .ma-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid #334155; }
        .ma-section h4 { margin-bottom: 12px; color: #94a3b8; font-size: 0.9rem; }
        .ma-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
        .ma-item { padding: 10px; background: #0f172a; border-radius: 6px; }
        .ma-item .label { display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 4px; }
        .ma-item .value { font-weight: 600; }
        .ma-item .diff { font-size: 0.8rem; margin-left: 6px; }
        .ma-item .diff.positive { color: #22c55e; }
        .ma-item .diff.negative { color: #ef4444; }
        .ma-item .value.positive { color: #22c55e; }
        .ma-item .value.negative { color: #ef4444; }
        
        @media (max-width: 600px) {
          .returns-grid { grid-template-columns: repeat(2, 1fr); }
          .criteria-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
