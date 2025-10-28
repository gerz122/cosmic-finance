export interface MarketData {
    ticker: string;
    price: number;
    dayChange: number;
}

export interface TickerSearchResult {
    ticker: string;
    name: string;
}

// Using a free, open-source proxy for Yahoo Finance data.
// This is more reliable and sustainable than using the Gemini API for financial data.
const API_BASE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=';
const SEARCH_API_URL = 'https://query2.finance.yahoo.com/v1/finance/search?q=';


const getLiveStockData = async (ticker: string): Promise<MarketData> => {
    try {
        const response = await fetch(`${API_BASE_URL}${ticker}`);
        if (!response.ok) {
            throw new Error(`Yahoo Finance API request failed with status ${response.status}`);
        }
        const data = await response.json();
        const result = data.quoteResponse?.result?.[0];

        if (!result) {
            throw new Error(`Ticker not found or invalid response for ${ticker}`);
        }

        return {
            ticker: result.symbol,
            price: result.regularMarketPrice,
            dayChange: result.regularMarketChange,
        };
    } catch (error) {
        console.error(`Error fetching live stock data for ${ticker}:`, error);
        // Return a fallback structure so the UI doesn't crash
        return { ticker, price: 0, dayChange: 0 };
    }
};

const getMultipleStockData = async (tickers: string[]): Promise<MarketData[]> => {
    if (tickers.length === 0) return [];
    try {
        const response = await fetch(`${API_BASE_URL}${tickers.join(',')}`);
        if (!response.ok) {
            throw new Error(`Yahoo Finance API request failed with status ${response.status}`);
        }
        const data = await response.json();
        const results = data.quoteResponse?.result || [];

        return results.map((result: any) => ({
             ticker: result.symbol,
             price: result.regularMarketPrice,
             dayChange: result.regularMarketChange,
        }));
    } catch (error) {
        console.error(`Error fetching multiple stock data:`, error);
        return [];
    }
};


const searchTickers = async (query: string): Promise<TickerSearchResult[]> => {
    if (!query) return [];
    try {
        const response = await fetch(`${SEARCH_API_URL}${query}`);
        if (!response.ok) {
            throw new Error(`Yahoo Finance search request failed with status ${response.status}`);
        }
        const data = await response.json();
        const quotes = data.quotes || [];

        return quotes
            .filter((q: any) => q.symbol && q.longname) // Filter out items without a ticker or name
            .map((q: any) => ({
                ticker: q.symbol,
                name: q.longname,
            }))
            .slice(0, 5); // Return top 5 results

    } catch (error) {
        console.error(`Error searching for tickers with query "${query}":`, error);
        return [];
    }
};


export const marketDataService = {
    getLiveStockData,
    getMultipleStockData,
    searchTickers,
};
