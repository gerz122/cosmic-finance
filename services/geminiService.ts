

import { GoogleGenAI, Type } from "@google/genai";
// FIX: Import Account and AccountType to correctly calculate cash from accounts.
import type { FinancialStatement, CosmicEvent, Account } from '../types';
import { AccountType } from '../types';
import type { LiveStockData } from '../components/RealTimeStockData';

// FIX: Per coding guidelines, the API key must be read from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// FIX: Update signature to accept accounts array to properly calculate cash.
function formatFinancialDataForPrompt(statement: FinancialStatement, accounts: Account[]): string {
    const totalIncome = statement.transactions
        .filter(t => t.type === 'INCOME' && !t.isPassive)
        .reduce((sum, t) => sum + t.amount, 0);
    const passiveIncome = statement.transactions
        .filter(t => t.type === 'INCOME' && t.isPassive)
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = statement.transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);
    const netWorth = statement.assets.reduce((sum, a) => sum + a.value, 0) - statement.liabilities.reduce((sum, l) => sum + l.balance, 0);
    // FIX: Calculate cash from accounts, not from assets, to fix type error.
    const cash = accounts
        .filter(a => a.type === AccountType.CASH || a.type === AccountType.CHECKING)
        .reduce((sum, a) => sum + a.balance, 0);

    return `
      Current Financial Snapshot:
      - Monthly Active Income: $${totalIncome.toFixed(2)}
      - Monthly Passive Income: $${passiveIncome.toFixed(2)}
      - Monthly Expenses: $${totalExpenses.toFixed(2)}
      - Net Worth: $${netWorth.toFixed(2)}
      - Available Cash: $${cash.toFixed(2)}
      The user is playing a financial game where the goal is for passive income to exceed total expenses.
    `;
}

// FIX: Update signature to accept accounts array.
export const getFinancialAdvice = async (prompt: string, statement: FinancialStatement, accounts: Account[]): Promise<string> => {
  try {
    const fullPrompt = `
      You are an expert financial coach in a game called 'Cosmic Cashflow'. Your advice should be encouraging, strategic, and use the game's fun, cosmic/sports-themed language (e.g., 'goal', 'foul', 'dribble past debt', 'cosmic win').

      Here is the player's current situation:
      ${formatFinancialDataForPrompt(statement, accounts)}

      Player's question: "${prompt}"

      Provide clear, actionable advice based on their situation and question. Keep it concise and motivating.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error fetching financial advice:", error);
    return "The stars are a bit cloudy right now... I couldn't get a signal. Please try asking again in a moment.";
  }
};


// FIX: Update signature to accept accounts array.
export const getCosmicEvent = async (statement: FinancialStatement, accounts: Account[]): Promise<CosmicEvent> => {
  const financialContext = formatFinancialDataForPrompt(statement, accounts);
  // FIX: Calculate cash from accounts, not from assets, to fix type error.
  const availableCash = accounts
    .filter(a => a.type === AccountType.CASH || a.type === AccountType.CHECKING)
    .reduce((sum, a) => sum + a.balance, 0);

  const prompt = `
    You are the Game Master for 'Cosmic Cashflow'. Generate a random financial event for a player. The event should be a choice between two options. It could be an investment opportunity, a business venture, or an unexpected financial situation.
    
    - The theme is cosmic/space. Use creative names like 'Asteroid Mining Corp' or 'Martian Real Estate'.
    - One choice should be a risk/reward action, and the other a safe/neutral action.
    - The risk/reward action cost should be realistic for the player, ideally less than 50% of their available cash ($${availableCash.toFixed(2)}).
    - Provide the response ONLY in the specified JSON format.
    
    Player's situation:
    ${financialContext}
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      choices: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            outcome: {
              type: Type.OBJECT,
              properties: {
                message: { type: Type.STRING },
                cashChange: { type: Type.NUMBER, description: "A negative number for costs, positive for gains." },
                newAsset: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['STOCK', 'REAL_ESTATE'] },
                    value: { type: Type.NUMBER },
                    monthlyCashflow: { type: Type.NUMBER },
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema,
        }
    });

    const eventJson = JSON.parse(response.text);

    // Basic validation to ensure we have two choices.
    if (!eventJson.choices || eventJson.choices.length !== 2) {
      throw new Error("AI did not generate two choices.");
    }
    
    return eventJson as CosmicEvent;
  } catch (error) {
    console.error("Error generating cosmic event:", error);
    // Fallback event in case of AI error
    return {
      title: "Signal Lost",
      description: "A solar flare interrupted our transmission from the opportunities quadrant! For now, the cosmos is quiet.",
      choices: [
        {
          text: "Stay Put",
          outcome: { message: "You decide to wait for the solar flare to pass. No changes to your finances." }
        },
        {
          text: "Continue Scanning",
          outcome: { message: "You use some energy to scan again, but find nothing new." }
        }
      ]
    };
  }
};

export const searchTickers = async (query: string): Promise<{ticker: string, name: string}[]> => {
    if (!query || query.length < 1) {
        return [];
    }

    const prompt = `
        Based on the search query "${query}", find up to 5 relevant stock tickers and their company names.
        Provide the response ONLY in the specified JSON format.
        If you can't find anything, return an empty array.
    `;
    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                ticker: { type: Type.STRING },
                name: { type: Type.STRING }
            }
        }
    };
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema
            }
        });
        const results = JSON.parse(response.text);
        return results;

    } catch (error) {
        console.error("Error searching for tickers:", error);
        return [];
    }
};

export const getLiveStockData = async (ticker: string): Promise<LiveStockData> => {
    const fallbackData: LiveStockData = { price: null, dayChange: null, dayChangePercent: null };
    if (!ticker) return fallbackData;

    const prompt = `
      You are an API that provides stock data. Your data source is Google Finance.
      For the ticker symbol: ${ticker}, provide the latest market data.
      Respond ONLY with the specified JSON format.
      If Google Finance does not recognize the ticker or no data is available, return nulls for all values.
    `;
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            price: { type: Type.NUMBER, nullable: true },
            dayChange: { type: Type.NUMBER, nullable: true, description: "The change in price for the day." },
            dayChangePercent: { type: Type.NUMBER, nullable: true, description: "The percentage change for the day." }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema
            }
        });
        const result = JSON.parse(response.text) as LiveStockData;
        if (result.price === null) {
            console.warn(`Could not fetch live data for ticker from Google Finance: ${ticker}`);
            return fallbackData;
        }
        return result;

    } catch (error) {
        console.error(`Error fetching live stock data for ${ticker}:`, error);
        return fallbackData;
    }
};