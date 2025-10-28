
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

const API_KEY = (import.meta as any).env.VITE_ALPHA_VANTAGE_API_KEY;
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

// CRITICAL FIX: Add suffix for Argentinian stocks
const getTickerWithSuffix = (ticker: string) => {
    const argentinianStocks = ['GGAL', 'PAM', 'YPF', 'SUPV', 'BBAR', 'BMA', 'LOMA', 'VIST'];
    if (argentinianStocks.includes(ticker.toUpperCase())) {
        return `${ticker}.BA`;
    }
    return ticker;
};

const getLiveStockData = async (ticker: string): Promise<MarketData> => {
    if (!API_KEY) {
        console.error("Alpha Vantage API key is not set. Returning mock data.");
        return { ticker, price: 100.00, dayChange: 1.50, previousClose: 98.50 };
    }

    const tickerWithSuffix = getTickerWithSuffix(ticker);

    try {
        await ensureApiRateLimit();
        const response = await fetch(`${BASE_URL}?function=GLOBAL_QUOTE&symbol=${tickerWithSuffix}&apikey=${API_KEY}`);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        
        const data = await response.json();
        const quote = data['Global Quote'];

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
    
    const results: MarketData[] = [];
    for (const ticker of tickers) {
        const data = await getLiveStockData(ticker);
        results.push(data);
    }
    return results;
};

const searchTickers = async (query: string): Promise<TickerSearchResult[]> => {
    if (!query || !API_KEY) return [];

    try {
        await ensureApiRateLimit();
        const response = await fetch(`${BASE_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${API_KEY}`);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const data = await response.json();
        const matches = data['bestMatches'] || [];

        return matches
            //.filter((match: any) => !match['1. symbol'].includes('.')) // Allow various markets
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
