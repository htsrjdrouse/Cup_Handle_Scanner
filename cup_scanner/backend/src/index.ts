import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// ============= CONSTANTS =============

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Hardcoded S&P 500 list
const SP500_TICKERS = [
  "AAPL", "ABBV", "ABT", "ACN", "ADBE", "ADI", "ADM", "ADP", "ADSK", "AEE", "AEP", "AES", "AFL", "AIG", "AIZ",
  "AJG", "AKAM", "ALB", "ALGN", "ALL", "ALLE", "AMAT", "AMCR", "AMD", "AME", "AMGN", "AMP", "AMT", "AMZN",
  "ANET", "ANSS", "AON", "AOS", "APA", "APD", "APH", "APTV", "ARE", "ATO", "AVB", "AVGO", "AVY", "AWK", "AXON",
  "AXP", "AZO", "BA", "BAC", "BALL", "BAX", "BBWI", "BBY", "BDX", "BEN", "BF.B", "BG", "BIIB", "BIO", "BK",
  "BKNG", "BKR", "BLDR", "BLK", "BMY", "BR", "BRK.B", "BRO", "BSX", "BWA", "BX", "BXP", "C", "CAG", "CAH",
  "CARR", "CAT", "CB", "CBOE", "CBRE", "CCI", "CCL", "CDNS", "CDW", "CE", "CEG", "CF", "CFG", "CHD", "CHRW",
  "CHTR", "CI", "CINF", "CL", "CLX", "CMA", "CMCSA", "CME", "CMG", "CMI", "CMS", "CNC", "CNP", "COF", "COO",
  "COP", "COR", "COST", "CPAY", "CPB", "CPRT", "CPT", "CRL", "CRM", "CSCO", "CSGP", "CSX", "CTAS", "CTLT",
  "CTRA", "CTSH", "CTVA", "CVS", "CVX", "CZR", "D", "DAL", "DD", "DE", "DECK", "DFS", "DG", "DGX", "DHI",
  "DHR", "DIS", "DLR", "DLTR", "DOC", "DOV", "DOW", "DPZ", "DRI", "DTE", "DUK", "DVA", "DVN", "DXCM", "EA",
  "EBAY", "ECL", "ED", "EFX", "EG", "EIX", "EL", "ELV", "EMN", "EMR", "ENPH", "EOG", "EPAM", "EQIX", "EQR",
  "EQT", "ES", "ESS", "ETN", "ETR", "ETSY", "EVRG", "EW", "EXC", "EXPD", "EXPE", "EXR", "F", "FANG", "FAST",
  "FCX", "FDS", "FDX", "FE", "FFIV", "FI", "FICO", "FIS", "FITB", "FLT", "FMC", "FOX", "FOXA", "FRT", "FSLR",
  "FTNT", "FTV", "GD", "GDDY", "GE", "GEHC", "GEN", "GEV", "GILD", "GIS", "GL", "GLW", "GM", "GNRC", "GOOG",
  "GOOGL", "GPC", "GPN", "GRMN", "GS", "GWW", "HAL", "HAS", "HBAN", "HCA", "HD", "HES", "HIG", "HII", "HLT",
  "HOLX", "HON", "HPE", "HPQ", "HRL", "HSIC", "HST", "HSY", "HUBB", "HUM", "HWM", "IBM", "ICE", "IDXX", "IEX",
  "IFF", "ILMN", "INCY", "INTC", "INTU", "INVH", "IP", "IPG", "IQV", "IR", "IRM", "ISRG", "IT", "ITW", "IVZ",
  "J", "JBHT", "JBL", "JCI", "JKHY", "JNJ", "JNPR", "JPM", "K", "KDP", "KEY", "KEYS", "KHC", "KIM", "KKR",
  "KLAC", "KMB", "KMI", "KMX", "KO", "KR", "KVUE", "L", "LDOS", "LEN", "LH", "LHX", "LIN", "LKQ", "LLY",
  "LMT", "LNT", "LOW", "LRCX", "LULU", "LUV", "LVS", "LW", "LYB", "LYV", "MA", "MAA", "MAR", "MAS", "MCD",
  "MCHP", "MCK", "MCO", "MDLZ", "MDT", "MET", "META", "MGM", "MHK", "MKC", "MKTX", "MLM", "MMC", "MMM", "MNST",
  "MO", "MOH", "MOS", "MPC", "MPWR", "MRK", "MRNA", "MRO", "MS", "MSCI", "MSFT", "MSI", "MTB", "MTCH", "MTD",
  "MU", "NCLH", "NDAQ", "NDSN", "NEE", "NEM", "NFLX", "NI", "NKE", "NOC", "NOW", "NRG", "NSC", "NTAP", "NTRS",
  "NUE", "NVDA", "NVR", "NWS", "NWSA", "NXPI", "O", "ODFL", "OKE", "OMC", "ON", "ORCL", "ORLY", "OTIS", "OXY",
  "PANW", "PARA", "PAYC", "PAYX", "PCAR", "PCG", "PEG", "PEP", "PFE", "PFG", "PG", "PGR", "PH", "PHM", "PKG",
  "PLD", "PLTR", "PM", "PNC", "PNR", "PNW", "PODD", "POOL", "PPG", "PPL", "PRU", "PSA", "PSX", "PTC", "PWR",
  "PYPL", "QCOM", "QRVO", "RCL", "REG", "REGN", "RF", "RJF", "RL", "RMD", "ROK", "ROL", "ROP", "ROST", "RSG",
  "RTX", "RVTY", "SBAC", "SBUX", "SCHW", "SHW", "SJM", "SLB", "SMCI", "SNA", "SNPS", "SO", "SOLV", "SPG",
  "SPGI", "SRE", "STE", "STLD", "STT", "STX", "STZ", "SWK", "SWKS", "SYF", "SYK", "SYY", "T", "TAP", "TDG",
  "TDY", "TECH", "TEL", "TER", "TFC", "TFX", "TGT", "TJX", "TMO", "TMUS", "TPR", "TRGP", "TRMB", "TROW",
  "TRV", "TSCO", "TSLA", "TSN", "TT", "TTWO", "TXN", "TXT", "TYL", "UAL", "UBER", "UDR", "UHS", "ULTA", "UNH",
  "UNP", "UPS", "URI", "USB", "V", "VICI", "VLO", "VLTO", "VMC", "VRSK", "VRSN", "VRTX", "VST", "VTR", "VTRS",
  "VZ", "WAB", "WAT", "WBA", "WBD", "WDC", "WEC", "WELL", "WFC", "WM", "WMB", "WMT", "WRB", "WST", "WTW", "WY",
  "WYNN", "XEL", "XOM", "XYL", "YUM", "ZBH", "ZBRA", "ZTS"
];

interface StockData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============= YAHOO FINANCE API FUNCTIONS =============

async function fetchStockData(symbol: string): Promise<StockData[] | null> {
  try {
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (365 * 24 * 60 * 60); // 1 year ago
    
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        params: { 
          period1: startDate, 
          period2: endDate, 
          interval: '1d' 
        },
        headers: YAHOO_HEADERS,
        timeout: 30000
      }
    );
    
    const result = response.data.chart.result;
    if (!result || result.length === 0) return null;
    
    const data = result[0];
    const quotes = data.indicators.quote[0];
    const timestamps = data.timestamp;
    
    if (!timestamps || !quotes) return null;
    
    return timestamps.map((t: number, i: number) => ({
      date: new Date(t * 1000),
      open: quotes.open[i] || 0,
      high: quotes.high[i] || 0,
      low: quotes.low[i] || 0,
      close: quotes.close[i] || 0,
      volume: quotes.volume[i] || 0
    })).filter((q: StockData) => q.close !== null && q.close > 0);
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

// Company database for fallback info
const COMPANY_INFO: { [symbol: string]: any } = {
  "AAPL": { name: "Apple Inc.", sector: "Technology", industry: "Consumer Electronics", description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, Mac, iPad, and wearables." },
  "MSFT": { name: "Microsoft Corporation", sector: "Technology", industry: "Software - Infrastructure", description: "Microsoft develops, licenses, and supports software, services, devices, and solutions worldwide including Windows, Office, Azure cloud services." },
  "GOOGL": { name: "Alphabet Inc.", sector: "Technology", industry: "Internet Content & Information", description: "Alphabet provides online advertising services, cloud computing, software, and hardware through Google Search, YouTube, Android, and Google Cloud." },
  "AMZN": { name: "Amazon.com Inc.", sector: "Consumer Cyclical", industry: "Internet Retail", description: "Amazon engages in retail, AWS cloud services, advertising, and subscription services worldwide." },
  "NVDA": { name: "NVIDIA Corporation", sector: "Technology", industry: "Semiconductors", description: "NVIDIA provides graphics processing units and system-on-chip units for gaming, professional visualization, data center, and automotive markets." },
  "META": { name: "Meta Platforms Inc.", sector: "Technology", industry: "Internet Content & Information", description: "Meta develops products for connecting and sharing through Facebook, Instagram, WhatsApp, and Reality Labs." },
  "TSLA": { name: "Tesla Inc.", sector: "Consumer Cyclical", industry: "Auto Manufacturers", description: "Tesla designs, develops, manufactures, leases, and sells electric vehicles, energy generation and storage systems." },
  "BRK.B": { name: "Berkshire Hathaway Inc.", sector: "Financial Services", industry: "Insurance - Diversified", description: "Berkshire Hathaway operates in insurance, freight rail, utilities, manufacturing, and retail businesses." },
  "JPM": { name: "JPMorgan Chase & Co.", sector: "Financial Services", industry: "Banks - Diversified", description: "JPMorgan Chase operates as a financial services company providing investment banking, financial services for consumers and businesses." },
  "V": { name: "Visa Inc.", sector: "Financial Services", industry: "Credit Services", description: "Visa operates as a payments technology company facilitating digital payments worldwide." },
  "UNH": { name: "UnitedHealth Group", sector: "Healthcare", industry: "Healthcare Plans", description: "UnitedHealth Group operates as a diversified health care company offering health benefits and services." },
  "HD": { name: "The Home Depot Inc.", sector: "Consumer Cyclical", industry: "Home Improvement Retail", description: "Home Depot operates as a home improvement retailer selling building materials, home improvement products, and lawn and garden products." },
  "MA": { name: "Mastercard Inc.", sector: "Financial Services", industry: "Credit Services", description: "Mastercard is a technology company in the global payments industry connecting consumers, financial institutions, merchants, and governments." },
  "PG": { name: "Procter & Gamble Co.", sector: "Consumer Defensive", industry: "Household Products", description: "P&G provides branded consumer packaged goods including beauty, grooming, health care, fabric care, and home care products." },
  "JNJ": { name: "Johnson & Johnson", sector: "Healthcare", industry: "Drug Manufacturers", description: "Johnson & Johnson researches, develops, manufactures, and sells products in health care including pharmaceuticals and medical devices." },
  "XOM": { name: "Exxon Mobil Corp.", sector: "Energy", industry: "Oil & Gas Integrated", description: "Exxon Mobil explores for and produces crude oil and natural gas and manufactures petroleum products." },
  "COST": { name: "Costco Wholesale Corp.", sector: "Consumer Defensive", industry: "Discount Stores", description: "Costco operates membership warehouses selling branded and private-label products in a range of merchandise categories." },
  "ABBV": { name: "AbbVie Inc.", sector: "Healthcare", industry: "Drug Manufacturers", description: "AbbVie discovers, develops, manufactures, and sells pharmaceuticals for immunology, oncology, and neuroscience." },
  "CRM": { name: "Salesforce Inc.", sector: "Technology", industry: "Software - Application", description: "Salesforce provides enterprise cloud computing and CRM solutions to businesses worldwide." },
  "AMD": { name: "Advanced Micro Devices", sector: "Technology", industry: "Semiconductors", description: "AMD designs and sells microprocessors, GPUs, and related technologies for computer, gaming, and data center markets." },
  "NFLX": { name: "Netflix Inc.", sector: "Communication Services", industry: "Entertainment", description: "Netflix provides streaming entertainment services with TV series, documentaries, feature films, and games." },
  "INTC": { name: "Intel Corporation", sector: "Technology", industry: "Semiconductors", description: "Intel designs, manufactures, and sells computing and communication products including processors and chipsets." },
  "DIS": { name: "Walt Disney Company", sector: "Communication Services", industry: "Entertainment", description: "Disney operates as an entertainment company with theme parks, media networks, streaming, and film studios." },
  "KO": { name: "Coca-Cola Company", sector: "Consumer Defensive", industry: "Beverages", description: "Coca-Cola manufactures, markets, and sells nonalcoholic beverages worldwide." },
  "PEP": { name: "PepsiCo Inc.", sector: "Consumer Defensive", industry: "Beverages", description: "PepsiCo manufactures, markets, and sells beverages and convenient foods worldwide." },
  "WMT": { name: "Walmart Inc.", sector: "Consumer Defensive", industry: "Discount Stores", description: "Walmart operates retail and wholesale stores in various formats including supercenters, discount stores, and e-commerce." },
  "BA": { name: "Boeing Company", sector: "Industrials", industry: "Aerospace & Defense", description: "Boeing designs, develops, manufactures, and sells commercial jetliners, military aircraft, and defense systems." },
  "NKE": { name: "Nike Inc.", sector: "Consumer Cyclical", industry: "Footwear & Accessories", description: "Nike designs, develops, markets, and sells athletic footwear, apparel, equipment, and accessories." },
};

async function fetchCompanyInfo(symbol: string): Promise<any> {
  // First try to get data from the chart endpoint (which works)
  try {
    const chartResponse = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
      {
        params: { 
          period1: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, 
          period2: Math.floor(Date.now() / 1000), 
          interval: '1d',
          includePrePost: false
        },
        headers: YAHOO_HEADERS,
        timeout: 15000
      }
    );
    
    const result = chartResponse.data.chart.result?.[0];
    const meta = result?.meta || {};
    
    // Get company info from our database
    const dbInfo = COMPANY_INFO[symbol] || {};
    
    // Calculate 52-week high/low from recent data
    const quotes = result?.indicators?.quote?.[0];
    const highs = quotes?.high?.filter((h: number) => h) || [];
    const lows = quotes?.low?.filter((l: number) => l) || [];
    
    return {
      companyName: dbInfo.name || meta.longName || meta.shortName || symbol,
      exchange: meta.exchangeName || meta.fullExchangeName || 'NASDAQ/NYSE',
      sector: dbInfo.sector || 'Unknown',
      industry: dbInfo.industry || 'Unknown',
      businessSummary: dbInfo.description || `${meta.longName || symbol} trades on ${meta.exchangeName || 'US exchanges'}.`,
      website: null,
      employees: null,
      marketCap: null, // Not available from chart
      peRatio: null,
      forwardPE: null,
      eps: null,
      dividend: null,
      fiftyTwoWeekHigh: highs.length > 0 ? Math.max(...highs) : null,
      fiftyTwoWeekLow: lows.length > 0 ? Math.min(...lows) : null,
      currentPrice: meta.regularMarketPrice || null,
      previousClose: meta.chartPreviousClose || meta.previousClose || null,
      dayHigh: meta.regularMarketDayHigh || (highs.length > 0 ? highs[highs.length - 1] : null),
      dayLow: meta.regularMarketDayLow || (lows.length > 0 ? lows[lows.length - 1] : null),
      volume: meta.regularMarketVolume || null,
      currency: meta.currency || 'USD',
      instrumentType: meta.instrumentType || 'EQUITY',
      timezone: meta.timezone || 'America/New_York',
    };
  } catch (error) {
    console.error(`Error fetching company info for ${symbol}:`, error);
    
    // Return database info as fallback
    const dbInfo = COMPANY_INFO[symbol];
    if (dbInfo) {
      return {
        companyName: dbInfo.name,
        exchange: 'NASDAQ/NYSE',
        sector: dbInfo.sector,
        industry: dbInfo.industry,
        businessSummary: dbInfo.description,
        website: null,
        marketCap: null,
        currentPrice: null,
      };
    }
    
    return null;
  }
}

function formatMarketCap(value: number | null): string {
  if (!value) return 'N/A';
  if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  return value.toLocaleString();
}

async function searchStocks(query: string): Promise<any[]> {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v1/finance/search`,
      {
        params: {
          q: query,
          quotesCount: 10,
          newsCount: 0,
          enableFuzzyQuery: true,
          quotesQueryId: 'tss_match_phrase_query'
        },
        headers: YAHOO_HEADERS,
        timeout: 10000
      }
    );
    
    const quotes = response.data.quotes || [];
    return quotes
      .filter((q: any) => q.quoteType === 'EQUITY' && q.symbol)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: q.exchange || 'Unknown',
        type: q.quoteType
      }))
      .slice(0, 10);
  } catch (error) {
    console.error('Search error:', error);
    // Fallback to local search
    const upperQuery = query.toUpperCase();
    return SP500_TICKERS
      .filter(t => t.startsWith(upperQuery))
      .slice(0, 10)
      .map(symbol => ({
        symbol,
        name: symbol,
        exchange: 'US',
        type: 'EQUITY'
      }));
  }
}

async function getNasdaqTickers(): Promise<string[]> {
  try {
    const response = await axios.get(
      'https://api.nasdaq.com/api/screener/stocks',
      {
        params: { tableonly: 'true', limit: 5000, exchange: 'NASDAQ' },
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
      }
    );
    
    const data = response.data;
    if (data?.data?.table?.rows) {
      return data.data.table.rows
        .filter((row: any) => {
          const symbol = row.symbol || '';
          const marketCap = parseInt((row.marketCap || '0').replace(/,/g, '')) || 0;
          return symbol && !symbol.includes('^') && !symbol.includes('/') && marketCap >= 1000000000;
        })
        .map((row: any) => row.symbol);
    }
  } catch (error) {
    console.error('Error fetching NASDAQ tickers:', error);
  }
  return SP500_TICKERS;
}

async function getNyseTickers(): Promise<string[]> {
  try {
    const response = await axios.get(
      'https://api.nasdaq.com/api/screener/stocks',
      {
        params: { tableonly: 'true', limit: 5000, exchange: 'NYSE' },
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 30000
      }
    );
    
    const data = response.data;
    if (data?.data?.table?.rows) {
      return data.data.table.rows
        .filter((row: any) => {
          const symbol = row.symbol || '';
          const marketCap = parseInt((row.marketCap || '0').replace(/,/g, '')) || 0;
          return symbol && !symbol.includes('^') && !symbol.includes('/') && marketCap >= 1000000000;
        })
        .map((row: any) => row.symbol);
    }
  } catch (error) {
    console.error('Error fetching NYSE tickers:', error);
  }
  return [];
}

// ============= PATTERN DETECTION =============

function detectCupAndHandle(closes: number[], highs: number[], lows: number[]): any {
  const minCupDays = 20;
  const maxCupDays = 130;
  
  if (closes.length < maxCupDays + 30) return null;
  
  const findLocalExtrema = (data: number[], order: number, isMax: boolean) => {
    const indices: number[] = [];
    for (let i = order; i < data.length - order; i++) {
      let isExtreme = true;
      for (let j = 1; j <= order; j++) {
        if (isMax) {
          if (data[i] < data[i - j] || data[i] < data[i + j]) isExtreme = false;
        } else {
          if (data[i] > data[i - j] || data[i] > data[i + j]) isExtreme = false;
        }
      }
      if (isExtreme) indices.push(i);
    }
    return indices;
  };
  
  const localMax = findLocalExtrema(closes, 10, true);
  const localMin = findLocalExtrema(closes, 10, false);
  
  if (localMax.length < 2 || localMin.length < 1) return null;
  
  const lookback = Math.min(closes.length, maxCupDays + 50);
  const recentMax = localMax.filter(i => i >= closes.length - lookback);
  const recentMin = localMin.filter(i => i >= closes.length - lookback);
  
  if (recentMax.length < 2 || recentMin.length < 1) return null;
  
  let bestPattern: any = null;
  let bestScore = 0;
  
  for (let i = 0; i < recentMax.length - 1; i++) {
    for (let j = i + 1; j < recentMax.length; j++) {
      const cupLength = recentMax[j] - recentMax[i];
      
      if (cupLength < minCupDays || cupLength > maxCupDays) continue;
      
      const bottomCandidates = recentMin.filter(m => recentMax[i] < m && m < recentMax[j]);
      if (bottomCandidates.length === 0) continue;
      
      const bottomIdx = bottomCandidates.reduce((min, curr) => 
        closes[curr] < closes[min] ? curr : min
      );
      
      const leftRim = closes[recentMax[i]];
      const rightRim = closes[recentMax[j]];
      const bottom = closes[bottomIdx];
      
      const avgRim = (leftRim + rightRim) / 2;
      const cupDepth = (avgRim - bottom) / avgRim * 100;
      
      if (cupDepth < 12 || cupDepth > 35) continue;
      
      const rimDiff = Math.abs(leftRim - rightRim) / avgRim * 100;
      if (rimDiff > 5) continue;
      
      const leftDays = bottomIdx - recentMax[i];
      const rightDays = recentMax[j] - bottomIdx;
      const symmetry = 1 - Math.abs(leftDays - rightDays) / cupLength;
      
      const handleStart = recentMax[j];
      const handleData = closes.slice(handleStart);
      
      if (handleData.length < 5) continue;
      
      const handleLow = Math.min(...handleData);
      const handleDecline = (rightRim - handleLow) / rightRim * 100;
      
      if (handleDecline < 2 || handleDecline > 15) continue;
      
      const score = 100 - Math.abs(cupDepth - 25) - rimDiff - Math.abs(handleDecline - 8) + symmetry * 20;
      
      if (score > bestScore) {
        bestScore = score;
        bestPattern = {
          leftRimIdx: recentMax[i],
          rightRimIdx: recentMax[j],
          bottomIdx,
          leftRimPrice: leftRim,
          rightRimPrice: rightRim,
          bottomPrice: bottom,
          cupDepthPct: cupDepth,
          cupLengthDays: cupLength,
          handleLow,
          handleDeclinePct: handleDecline,
          symmetryPct: symmetry * 100,
          score
        };
      }
    }
  }
  
  return bestPattern;
}

function detectAscendingTriangle(closes: number[], highs: number[], lookback: number = 60): any {
  if (closes.length < lookback) return null;
  
  const recentHighs = highs.slice(-lookback);
  const localHighs: number[] = [];
  for (let i = 2; i < recentHighs.length - 2; i++) {
    if (recentHighs[i] > recentHighs[i-1] && recentHighs[i] > recentHighs[i-2] && 
        recentHighs[i] > recentHighs[i+1] && recentHighs[i] > recentHighs[i+2]) {
      localHighs.push(recentHighs[i]);
    }
  }
  
  if (localHighs.length < 3) return null;
  
  const lastHighs = localHighs.slice(-5);
  const resistance = lastHighs.reduce((a, b) => a + b, 0) / lastHighs.length;
  const highRange = (Math.max(...lastHighs) - Math.min(...lastHighs)) / resistance * 100;
  
  if (highRange > 3) return null;
  
  return { resistance, pattern: 'Ascending Triangle', score: 70 };
}

function detectBullFlag(closes: number[], highs: number[], lookback: number = 40): any {
  if (closes.length < lookback) return null;
  
  const polePeriod = Math.floor(lookback / 2);
  const poleData = closes.slice(0, polePeriod);
  
  if (poleData.length < 5) return null;
  
  const poleLowIdx = poleData.indexOf(Math.min(...poleData.slice(0, Math.floor(poleData.length / 2))));
  const poleHighIdx = poleData.indexOf(Math.max(...poleData.slice(0, Math.floor(poleData.length / 2))));
  
  if (poleLowIdx >= poleHighIdx) return null;
  
  const poleGain = (poleData[poleHighIdx] - poleData[poleLowIdx]) / poleData[poleLowIdx] * 100;
  
  if (poleGain < 10) return null;
  
  const flagData = closes.slice(polePeriod);
  const flagHigh = Math.max(...flagData);
  const flagLow = Math.min(...flagData);
  const flagRange = (flagHigh - flagLow) / poleData[poleHighIdx] * 100;
  
  if (flagRange > 15) return null;
  
  const target = flagHigh + (poleData[poleHighIdx] - poleData[poleLowIdx]);
  
  return { poleGain, flagHigh, flagLow, target, pattern: 'Bull Flag', score: 65 };
}

// ============= TECHNICAL INDICATORS =============

function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  
  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  const gains = changes.slice(-period).filter(c => c > 0);
  const losses = changes.slice(-period).filter(c => c < 0).map(c => Math.abs(c));
  
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
  
  if (avgLoss === 0) return 70;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateADX(closes: number[], highs: number[], lows: number[], period: number = 14): number {
  if (closes.length < period * 2) return 0;
  
  const atr = calculateATR(highs, lows, closes, period);
  if (atr === 0) return 0;
  
  const plusDM = [];
  const minusDM = [];
  
  for (let i = 1; i < closes.length; i++) {
    const highDiff = highs[i] - highs[i - 1];
    const lowDiff = lows[i - 1] - lows[i];
    
    if (highDiff > lowDiff && highDiff > 0) {
      plusDM.push(highDiff);
    } else {
      plusDM.push(0);
    }
    
    if (lowDiff > highDiff && lowDiff > 0) {
      minusDM.push(lowDiff);
    } else {
      minusDM.push(0);
    }
  }
  
  const trendStrength = (Math.max(...plusDM.slice(-period)) + Math.max(...minusDM.slice(-period))) / atr;
  return Math.min(100, Math.max(0, trendStrength * 10));
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number): number {
  if (closes.length < period + 1) return 0;
  
  const tr = [];
  for (let i = 1; i < closes.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    tr.push(Math.max(tr1, Math.max(tr2, tr3)));
  }
  
  const atrPeriod = tr.slice(-period);
  return atrPeriod.reduce((a, b) => a + b, 0) / period;
}

function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateEMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number; bullish: boolean } {
  if (closes.length < 26) return { macd: 0, signal: 0, histogram: 0, bullish: false };
  
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12 - ema26;
  
  // Calculate signal line (9-period EMA of MACD)
  const macdHistory = [];
  for (let i = 26; i <= closes.length; i++) {
    const e12 = calculateEMA(closes.slice(0, i), 12);
    const e26 = calculateEMA(closes.slice(0, i), 26);
    macdHistory.push(e12 - e26);
  }
  const signalLine = calculateEMA(macdHistory, 9);
  const histogram = macdLine - signalLine;
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram,
    bullish: histogram > 0
  };
}

function calculateVolumeRatio(volumes: number[]): number {
  if (volumes.length < 20) return 1;
  
  const recentAvg = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const olderAvg = volumes.slice(-20, -5).reduce((a, b) => a + b, 0) / 15;
  
  if (olderAvg === 0) return 1;
  return recentAvg / olderAvg;
}

// ============= BREAKOUT CRITERIA (from Python) =============

function checkBreakoutCriteria(
  closes: number[],
  highs: number[],
  lows: number[],
  volumes: number[],
  cupPattern: any
): any {
  const currentPrice = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2] || currentPrice;
  const prevOpen = closes[closes.length - 3] || currentPrice;
  
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const rsi = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const volumeRatio = calculateVolumeRatio(volumes);
  const adx = calculateADX(closes, highs, lows);
  
  // Buy point calculation
  let buyPoint = 0, stopLoss = 0, target = 0;
  if (cupPattern) {
    buyPoint = cupPattern.rightRimPrice + 0.10; // $0.10 above peak of handle
    stopLoss = cupPattern.handleLow;
    target = cupPattern.rightRimPrice + (cupPattern.rightRimPrice - cupPattern.bottomPrice);
  }
  
  // Check criteria (matching Python logic)
  const criteria = {
    breakoutConfirmed: cupPattern ? currentPrice > buyPoint : false,
    aboveSMA50: currentPrice > sma50,
    aboveSMA200: currentPrice > sma200,
    rsiHealthy: rsi >= 50 && rsi <= 70,
    rsiAcceptable: rsi >= 45 && rsi <= 75,
    volumeSpike: volumeRatio > 1.5,
    macdBullish: macd.bullish,
    macdCrossover: macd.histogram > 0 && macd.histogram < 0.5, // Recent crossover
  };
  
  // Check for bullish candle (Marubozu-like or engulfing)
  const lastOpen = closes[closes.length - 2] || currentPrice;
  const body = currentPrice - lastOpen;
  const fullRange = highs[highs.length - 1] - lows[lows.length - 1];
  const isBullishCandle = body > 0 && fullRange > 0 && body > fullRange * 0.6;
  
  // Bullish engulfing check
  const prevBody = prevClose - prevOpen;
  const isEngulfing = prevBody < 0 && body > 0;
  
  criteria['bullishCandle' as keyof typeof criteria] = isBullishCandle || isEngulfing;
  
  // Calculate signal score (matching Python)
  const signalScore = 
    (criteria.breakoutConfirmed ? 25 : 0) +
    (criteria.aboveSMA50 ? 15 : 0) +
    (criteria.aboveSMA200 ? 15 : 0) +
    (criteria.rsiHealthy ? 10 : 0) +
    (criteria.volumeSpike ? 15 : 0) +
    (criteria.macdBullish ? 10 : 0) +
    (criteria.macdCrossover ? 5 : 0) +
    ((criteria as any).bullishCandle ? 5 : 0);
  
  // Determine status (matching Python logic)
  let status = 'WATCH';
  if (cupPattern) {
    const resistance = cupPattern.rightRimPrice;
    if (criteria.breakoutConfirmed && criteria.aboveSMA50 && criteria.aboveSMA200) {
      if (signalScore >= 70) status = 'STRONG BUY';
      else if (signalScore >= 50) status = 'BUY';
      else status = 'WATCH';
    } else if (!criteria.breakoutConfirmed && currentPrice > resistance * 0.97) {
      status = 'FORMING - NEAR BREAKOUT';
    } else if (!criteria.breakoutConfirmed) {
      status = 'FORMING';
    }
  }
  
  // Calculate risk/reward
  const risk = buyPoint - stopLoss;
  const reward = target - buyPoint;
  const rrRatio = risk > 0 ? reward / risk : 0;
  
  return {
    currentPrice: Math.round(currentPrice * 100) / 100,
    buyPoint: Math.round(buyPoint * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    target: Math.round(target * 100) / 100,
    rrRatio: Math.round(rrRatio * 10) / 10,
    sma50: Math.round(sma50 * 100) / 100,
    sma200: Math.round(sma200 * 100) / 100,
    rsi: Math.round(rsi * 10) / 10,
    adx: Math.round(adx * 10) / 10,
    volumeRatio: Math.round(volumeRatio * 100) / 100,
    macd: macd.bullish,
    criteria,
    signalScore,
    status
  };
}

// ============= VALUATION =============

function calculateValuation(closes: number[]): any {
  if (!closes || closes.length < 50) {
    return { dcfValue: null, marginOfSafety: null, status: 'insufficient_data' };
  }
  
  const currentPrice = closes[closes.length - 1];
  const yearAgoPrice = closes[Math.max(0, closes.length - 252)];
  const sixMonthAgoPrice = closes[Math.max(0, closes.length - 126)];
  const threeMonthAgoPrice = closes[Math.max(0, closes.length - 63)];
  const oneMonthAgoPrice = closes[Math.max(0, closes.length - 21)];
  
  // Calculate various returns
  const yoyReturn = (currentPrice - yearAgoPrice) / yearAgoPrice;
  const sixMonthReturn = (currentPrice - sixMonthAgoPrice) / sixMonthAgoPrice;
  const threeMonthReturn = (currentPrice - threeMonthAgoPrice) / threeMonthAgoPrice;
  const oneMonthReturn = (currentPrice - oneMonthAgoPrice) / oneMonthAgoPrice;
  
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  
  // Multiple valuation methods
  // 1. Growth-based valuation
  const estimatedGrowthRate = yoyReturn * 0.5; // Conservative
  const years = 5;
  const discountRate = 0.10; // 10% discount rate
  const intrinsicFromGrowth = currentPrice * Math.pow(1 + Math.max(0.02, estimatedGrowthRate), years);
  
  // 2. Moving average valuation (mean reversion)
  const intrinsicFromMA = (sma50 + sma200) / 2;
  
  // 3. Historical average
  const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
  
  // Weight based on momentum
  const weight = yoyReturn > 0.15 ? 0.5 : 0.3;
  const maWeight = 0.3;
  const avgWeight = 1 - weight - maWeight;
  
  const estimatedIntrinsic = (intrinsicFromGrowth * weight) + (intrinsicFromMA * maWeight) + (avgPrice * avgWeight);
  
  const marginOfSafety = ((estimatedIntrinsic - currentPrice) / currentPrice) * 100;
  
  // Determine valuation status
  let valuationStatus = 'Fair Value';
  if (marginOfSafety > 20) valuationStatus = 'Undervalued';
  else if (marginOfSafety > 10) valuationStatus = 'Slightly Undervalued';
  else if (marginOfSafety < -20) valuationStatus = 'Overvalued';
  else if (marginOfSafety < -10) valuationStatus = 'Slightly Overvalued';
  
  // Price vs moving averages
  const priceVsSMA50 = ((currentPrice - sma50) / sma50) * 100;
  const priceVsSMA200 = ((currentPrice - sma200) / sma200) * 100;
  
  return {
    dcfValue: Math.round(estimatedIntrinsic * 100) / 100,
    marginOfSafety: Math.round(marginOfSafety * 10) / 10,
    currentPrice: Math.round(currentPrice * 100) / 100,
    valuationStatus,
    status: 'success',
    // Detailed breakdown
    details: {
      growthBasedValue: Math.round(intrinsicFromGrowth * 100) / 100,
      maBasedValue: Math.round(intrinsicFromMA * 100) / 100,
      historicalAvgValue: Math.round(avgPrice * 100) / 100,
      estimatedGrowthRate: Math.round(estimatedGrowthRate * 10000) / 100, // as percentage
      discountRate: discountRate * 100,
      projectionYears: years,
    },
    returns: {
      oneMonth: Math.round(oneMonthReturn * 10000) / 100,
      threeMonth: Math.round(threeMonthReturn * 10000) / 100,
      sixMonth: Math.round(sixMonthReturn * 10000) / 100,
      oneYear: Math.round(yoyReturn * 10000) / 100,
    },
    movingAverages: {
      sma50: Math.round(sma50 * 100) / 100,
      sma200: Math.round(sma200 * 100) / 100,
      priceVsSMA50: Math.round(priceVsSMA50 * 10) / 10,
      priceVsSMA200: Math.round(priceVsSMA200 * 10) / 10,
      aboveSMA50: currentPrice > sma50,
      aboveSMA200: currentPrice > sma200,
      goldenCross: sma50 > sma200,
    }
  };
}

// ============= API ROUTES =============

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    storage: 'memory', 
    tickers: SP500_TICKERS.length,
    markets: ['sp500', 'nasdaq', 'all'],
    features: [
      'Cup & Handle Detection',
      'Ascending Triangle Detection',
      'Bull Flag Detection',
      'Technical Indicators (RSI, MACD, ADX, SMA)',
      'Breakout Criteria Validation',
      'DCF Valuation',
      'Stock Search',
      'Company Info'
    ]
  });
});

// Stock search
app.get('/api/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  
  if (!query || query.length < 1) {
    return res.json({ results: [] });
  }
  
  try {
    const results = await searchStocks(query);
    res.json({ query, results });
  } catch (error) {
    res.json({ query, results: [], error: 'Search failed' });
  }
});

// Get tickers for a market
app.get('/api/tickers/:market', async (req: Request, res: Response) => {
  const market = req.params.market.toLowerCase();
  
  switch (market) {
    case 'sp500':
      res.json({ tickers: SP500_TICKERS, count: SP500_TICKERS.length, source: 'hardcoded' });
      break;
    case 'nasdaq':
      const nasdaq = await getNasdaqTickers();
      res.json({ tickers: nasdaq, count: nasdaq.length, source: 'nasdaq_api' });
      break;
    case 'all':
      const nyse = await getNyseTickers();
      const nasdaqAll = await getNasdaqTickers();
      const all = [...new Set([...nasdaqAll, ...nyse])];
      res.json({ tickers: all, count: all.length, source: 'nasdaq_nyse_api' });
      break;
    default:
      res.json({ tickers: SP500_TICKERS, count: SP500_TICKERS.length, source: 'hardcoded' });
  }
});

// Scan a single symbol
app.get('/api/scan/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  
  try {
    const data = await fetchStockData(symbol);
    if (!data || data.length < 150) {
      return res.status(404).json({ 
        error: 'Symbol not found or insufficient data',
        symbol
      });
    }
    
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);
    
    // Detect patterns
    const cupPattern = detectCupAndHandle(closes, highs, lows);
    const ascTriangle = detectAscendingTriangle(closes, highs);
    const bullFlag = detectBullFlag(closes, highs);
    
    // Check breakout criteria
    const breakout = checkBreakoutCriteria(closes, highs, lows, volumes, cupPattern);
    
    // Calculate valuation
    const valuation = calculateValuation(closes);
    
    // Determine final status and score
    let status = breakout.status;
    let score = cupPattern ? cupPattern.score : 0;
    
    if (!cupPattern && ascTriangle) {
      status = 'FORMING';
      score = ascTriangle.score;
    } else if (!cupPattern && !ascTriangle && bullFlag) {
      status = 'FORMING';
      score = bullFlag.score;
    } else if (!cupPattern && !ascTriangle && !bullFlag) {
      status = 'WATCH';
      score = 0;
    }
    
    const result = {
      symbol,
      currentPrice: breakout.currentPrice,
      status,
      score,
      patterns: {
        cupAndHandle: cupPattern,
        ascendingTriangle: ascTriangle,
        bullFlag: bullFlag
      },
      patternCount: (cupPattern ? 1 : 0) + (ascTriangle ? 1 : 0) + (bullFlag ? 1 : 0),
      indicators: {
        rsi: breakout.rsi,
        adx: breakout.adx,
        volumeRatio: breakout.volumeRatio,
        sma50: breakout.sma50,
        sma200: breakout.sma200,
        aboveSMA50: breakout.criteria.aboveSMA50,
        aboveSMA200: breakout.criteria.aboveSMA200,
        macdBullish: breakout.macd,
        buyPoint: breakout.buyPoint,
        stopLoss: breakout.stopLoss,
        target: breakout.target,
        rrRatio: breakout.rrRatio
      },
      criteria: breakout.criteria,
      signalScore: breakout.signalScore,
      // DCF Valuation
      dcfValue: valuation.dcfValue,
      marginOfSafety: valuation.marginOfSafety,
      valuationStatus: valuation.valuationStatus,
      // Detailed breakdowns
      details: valuation.details,
      returns: valuation.returns,
      movingAverages: valuation.movingAverages,
      scannedAt: new Date()
    };
    
    res.json(result);
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to scan symbol' });
  }
});

// Bulk scan a market
app.get('/api/scan', async (req: Request, res: Response) => {
  const market = (req.query.market as string || 'sp500').toLowerCase();
  const limit = parseInt(req.query.limit as string) || 500; // Default to 500, no artificial limit
  
  let tickers: string[];
  let marketName: string;
  
  switch (market) {
    case 'nasdaq':
      tickers = await getNasdaqTickers();
      marketName = 'NASDAQ ($1B+)';
      break;
    case 'all':
      const nyse = await getNyseTickers();
      const nasdaqAll = await getNasdaqTickers();
      tickers = [...new Set([...nasdaqAll, ...nyse])];
      marketName = 'All US ($1B+)';
      break;
    default:
      tickers = SP500_TICKERS;
      marketName = 'S&P 500';
  }
  
  const results: any[] = [];
  const tickersToScan = tickers.slice(0, limit);
  
  console.log(`Starting scan of ${marketName} (${tickersToScan.length} stocks)...`);
  
  for (let i = 0; i < tickersToScan.length; i++) {
    const symbol = tickersToScan[i];
    
    try {
      const data = await fetchStockData(symbol);
      if (!data || data.length < 150) continue;
      
      const closes = data.map(d => d.close);
      const highs = data.map(d => d.high);
      const lows = data.map(d => d.low);
      const volumes = data.map(d => d.volume);
      
      const cupPattern = detectCupAndHandle(closes, highs, lows);
      const ascTriangle = detectAscendingTriangle(closes, highs);
      const bullFlag = detectBullFlag(closes, highs);
      
      // Skip if no patterns found
      if (!cupPattern && !ascTriangle && !bullFlag) continue;
      
      const breakout = checkBreakoutCriteria(closes, highs, lows, volumes, cupPattern);
      const valuation = calculateValuation(closes);
      
      let status = breakout.status;
      let score = cupPattern ? cupPattern.score : 0;
      
      if (!cupPattern && ascTriangle) {
        status = 'FORMING';
        score = ascTriangle.score;
      } else if (!cupPattern && !ascTriangle && bullFlag) {
        status = 'FORMING';
        score = bullFlag.score;
      }
      
      results.push({
        symbol,
        currentPrice: breakout.currentPrice,
        status,
        score,
        patterns: { cupAndHandle: cupPattern, ascendingTriangle: ascTriangle, bullFlag },
        patternCount: (cupPattern ? 1 : 0) + (ascTriangle ? 1 : 0) + (bullFlag ? 1 : 0),
        cupDepth: cupPattern?.cupDepthPct?.toFixed(1) || '-',
        cupDays: cupPattern?.cupLengthDays || '-',
        handlePullback: cupPattern?.handleDeclinePct?.toFixed(1) || '-',
        rsi: breakout.rsi,
        adx: breakout.adx,
        volumeRatio: breakout.volumeRatio,
        aboveSMA50: breakout.criteria.aboveSMA50,
        aboveSMA200: breakout.criteria.aboveSMA200,
        macdBullish: breakout.macd,
        buyPoint: breakout.buyPoint,
        stopLoss: breakout.stopLoss,
        target: breakout.target,
        rrRatio: breakout.rrRatio,
        dcfValue: valuation.dcfValue,
        marginOfSafety: valuation.marginOfSafety,
        criteria: breakout.criteria,
        signalScore: breakout.signalScore,
        ascTriangle,
        bullFlag
      });
      
      // Progress update
      if ((i + 1) % 10 === 0) {
        console.log(`Scanned ${i + 1}/${tickersToScan.length} stocks, found ${results.length} patterns`);
        io.emit('scanProgress', { current: i + 1, total: tickersToScan.length, found: results.length });
      }
      
    } catch (e) {
      // Continue on error
    }
  }
  
  // Sort by status priority then score
  const statusOrder: { [key: string]: number } = {
    'STRONG BUY': 0,
    'BUY': 1,
    'FORMING - NEAR BREAKOUT': 2,
    'FORMING': 3,
    'WATCH': 4
  };
  
  results.sort((a, b) => {
    const statusDiff = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
    if (statusDiff !== 0) return statusDiff;
    return b.score - a.score;
  });
  
  console.log(`Scan complete. Found ${results.length} patterns.`);
  
  res.json({
    market: marketName,
    scanned: tickersToScan.length,
    found: results.length,
    results
  });
});

// Get historical data for chart with pattern markers
app.get('/api/history/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  
  try {
    const data = await fetchStockData(symbol);
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data available' });
    }
    
    // Get last 252 days for chart
    const chartData = data.slice(-252);
    const offset = data.length - chartData.length; // Offset to map full data indices to chart indices
    
    const yearData = chartData.map((d, index) => ({
      date: d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: d.date.toISOString().split('T')[0],
      price: d.close,
      volume: d.volume,
      high: d.high,
      low: d.low,
      open: d.open,
      index
    }));
    
    // Detect pattern on full data
    const closes = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const cupPattern = detectCupAndHandle(closes, highs, lows);
    
    // Map pattern indices to chart indices
    let patternMarkers = null;
    if (cupPattern) {
      const leftRimChartIdx = cupPattern.leftRimIdx - offset;
      const bottomChartIdx = cupPattern.bottomIdx - offset;
      const rightRimChartIdx = cupPattern.rightRimIdx - offset;
      
      // Only include if indices are within the chart range
      if (leftRimChartIdx >= 0 && rightRimChartIdx < yearData.length) {
        patternMarkers = {
          leftRim: {
            index: leftRimChartIdx,
            date: yearData[leftRimChartIdx]?.date,
            price: cupPattern.leftRimPrice
          },
          bottom: {
            index: bottomChartIdx,
            date: yearData[bottomChartIdx]?.date,
            price: cupPattern.bottomPrice
          },
          rightRim: {
            index: rightRimChartIdx,
            date: yearData[rightRimChartIdx]?.date,
            price: cupPattern.rightRimPrice
          },
          handleLow: {
            index: yearData.length - 1, // Approximate - handle is recent
            price: cupPattern.handleLow
          },
          target: cupPattern.rightRimPrice + (cupPattern.rightRimPrice - cupPattern.bottomPrice),
          cupDepthPct: cupPattern.cupDepthPct,
          cupLengthDays: cupPattern.cupLengthDays,
          handleDeclinePct: cupPattern.handleDeclinePct
        };
        
      }
    }
    
    res.json({ 
      symbol, 
      data: yearData, 
      totalDays: yearData.length,
      patternMarkers
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get company info
app.get('/api/company/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  
  try {
    const info = await fetchCompanyInfo(symbol);
    
    if (info) {
      res.json({
        symbol,
        ...info
      });
    } else {
      res.json({
        symbol,
        companyName: symbol,
        exchange: 'Unknown',
        sector: 'Unknown',
        industry: 'Unknown',
        businessSummary: 'Company information temporarily unavailable',
        website: null,
        marketCap: null,
        peRatio: null,
        eps: null,
        dividend: null,
        fiftyTwoWeekHigh: null,
        fiftyTwoWeekLow: null,
      });
    }
  } catch (error) {
    console.error('Company info error:', error);
    res.json({
      symbol,
      companyName: symbol,
      error: 'Failed to fetch company info'
    });
  }
});

// Get sentiment
app.get('/api/sentiment/:symbol', async (req: Request, res: Response) => {
  const symbol = req.params.symbol.toUpperCase();
  
  try {
    const data = await fetchStockData(symbol);
    if (!data || data.length < 50) {
      return res.json({ error: 'Insufficient data' });
    }
    
    const closes = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    const currentPrice = closes[closes.length - 1];
    
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);
    const rsi = calculateRSI(closes);
    const volumeRatio = calculateVolumeRatio(volumes);
    
    const priceMomentum = (closes[closes.length - 1] - closes[Math.max(0, closes.length - 20)]) / closes[Math.max(0, closes.length - 20)] * 100;
    const volumeStrength = volumeRatio > 1.2 ? 'High' : volumeRatio > 0.8 ? 'Normal' : 'Low';
    
    let sentimentScore = 50;
    
    if (currentPrice > sma50 && currentPrice > sma200) sentimentScore += 15;
    else if (currentPrice < sma50 && currentPrice < sma200) sentimentScore -= 15;
    
    if (rsi > 70) sentimentScore -= 10;
    else if (rsi < 30) sentimentScore += 10;
    
    if (priceMomentum > 10) sentimentScore += 10;
    else if (priceMomentum < -10) sentimentScore -= 10;
    
    sentimentScore = Math.max(0, Math.min(100, sentimentScore));
    
    res.json({
      symbol,
      overallSentiment: sentimentScore > 60 ? 'Bullish' : sentimentScore < 40 ? 'Bearish' : 'Neutral',
      sentimentScore: Math.round(sentimentScore),
      priceMomentum: Math.round(priceMomentum * 10) / 10,
      volumeStrength,
      newsSentiment: sentimentScore > 55 ? 'Positive' : sentimentScore < 45 ? 'Negative' : 'Neutral',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sentiment error:', error);
    res.json({
      symbol,
      overallSentiment: 'Unknown',
      sentimentScore: 50,
      error: 'Unable to fetch sentiment'
    });
  }
});

// Socket.IO for real-time progress
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 3005;

httpServer.listen(PORT, () => {
  console.log(`\n🥤 Cup & Handle Scanner API running on port ${PORT}`);
  console.log(`\nS&P 500 tickers loaded: ${SP500_TICKERS.length}`);
  console.log(`\nEndpoints:`);
  console.log(`  GET /api/health - Health check`);
  console.log(`  GET /api/search?q=AAPL - Search stocks`);
  console.log(`  GET /api/scan/:symbol - Scan single stock`);
  console.log(`  GET /api/scan?market=sp500&limit=100 - Bulk scan`);
  console.log(`  GET /api/company/:symbol - Company info`);
  console.log(`  GET /api/history/:symbol - Price history`);
  console.log(`  GET /api/sentiment/:symbol - Market sentiment\n`);
});
