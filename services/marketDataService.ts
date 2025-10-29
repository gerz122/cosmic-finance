export interface MarketData {
    ticker: string;
    price: number;
    dayChange: number;
    previousClose: number;
}

export interface TickerSearchResult {
    ticker: string;
    name: string;
}

// FIX: Changed from import.meta.env to process.env to resolve TypeScript error.
const API_KEY = process.env.VITE_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// Helper to handle API rate limiting (5 calls per minute for free tier)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let lastApiCallTime = 0;
const apiCallInterval = 13000; // 13 seconds to be safe

const ensureApiRateLimit = async () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    if (timeSinceLastCall < apiCallInterval) {
        await sleep(apiCallInterval - timeSinceLastCall);
    }
    lastApiCallTime = Date.now();
};

const getLiveStockData = async (ticker: string): Promise<MarketData> => {
    if (!API_KEY) {
        // Return mock data if API key is not set
        console.warn("Alpha Vantage API key not configured. Using mock data for stocks.");
        return {
            ticker,
            price: Math.random() * 500 + 50,
            dayChange: (Math.random() - 0.5) * 20,
            previousClose: Math.random() * 500 + 50,
        };
    }

    const tryFetch = async (symbol: string) => {
        await ensureApiRateLimit();
        const response = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        const data = await response.json();
        return data['Global Quote'];
    };

    try {
        let quote = await tryFetch(ticker);

        // If no data and it's a known Argentinian stock, try with .BA suffix as a fallback
        if ((!quote || Object.keys(quote).length === 0) && !ticker.toUpperCase().endsWith('.BA')) {
            const argentinianStocks = ['GGAL', 'PAM', 'YPF', 'SUPV', 'BBAR', 'BMA', 'LOMA', 'VIST'];
             if (argentinianStocks.includes(ticker.toUpperCase())) {
                console.log(`Retrying ${ticker} with .BA suffix...`);
                quote = await tryFetch(`${ticker}.BA`);
            }
        }
        
        if (!quote || Object.keys(quote).length === 0) {
            console.warn(`No data returned for ticker: ${ticker}. It might be an invalid symbol or delisted.`);
            return { ticker, price: 0, dayChange: 0, previousClose: 0 };
        }

        const price = parseFloat(quote['05. price']);
        const dayChange = parseFloat(quote['09. change']);
        const previousClose = parseFloat(quote['08. previous close']);

        return { ticker, price, dayChange, previousClose };

    } catch (error) {
        console.error(`Error fetching live stock data for ${ticker}:`, error);
        return { ticker, price: 0, dayChange: 0, previousClose: 0 }; // Return a default state on error
    }
};

const getMultipleStockData = async (tickers: string[]): Promise<MarketData[]> => {
    if (tickers.length === 0) return [];
    
    // Use Promise.all for concurrent requests, but ensure rate limit is handled inside getLiveStockData
    const promises = tickers.map(ticker => getLiveStockData(ticker));
    return Promise.all(promises);
};

const searchTickers = async (query: string): Promise<TickerSearchResult[]> => {
     if (!query) return [];
    if (!API_KEY) {
         console.warn("Alpha Vantage API key not configured. Using mock data for ticker search.");
         return [
            { ticker: "AAPL.MOCK", name: "Apple Inc. (Mock)"},
            { ticker: "GOOG.MOCK", name: "Alphabet Inc. (Mock)"},
            { ticker: "TSLA.MOCK", name: "Tesla Inc. (Mock)"},
         ].filter(t => t.ticker.includes(query.toUpperCase()) || t.name.toUpperCase().includes(query.toUpperCase()));
    }

    try {
        await ensureApiRateLimit();
        const response = await fetch(`${BASE_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${API_KEY}`);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const data = await response.json();
        const matches = data['bestMatches'] || [];

        return matches
            .map((match: any) => ({
                ticker: match['1. symbol'],
                name: match['2. name'],
            }));
            
    } catch (error) {
        console.error(`Error searching tickers for "${query}":`, error);
        return [];
    }
};

export const marketDataService = {
    getLiveStockData,
    getMultipleStockData,
    searchTickers,
};
