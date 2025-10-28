import { GoogleGenAI, Type } from "@google/genai";
import type { FinancialStatement, CosmicEvent, Account } from '../types';
import { AccountType } from '../types';

// CRITICAL FIX: The AI client is disabled to prevent the API_KEY error on Vercel.
// The app will run without AI features until this is re-enabled with a working API key setup.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


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

export const getFinancialAdvice = async (prompt: string, statement: FinancialStatement, accounts: Account[]): Promise<string> => {
  console.warn("AI Coach is currently disabled.");
  return "The AI Coach is temporarily offline for maintenance. Please try again later.";
  /*
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
  */
};

export const getCosmicEvent = async (statement: FinancialStatement, accounts: Account[]): Promise<CosmicEvent> => {
    console.warn("Cosmic Event generation is currently disabled.");
    // Return a default, safe event to ensure the app doesn't crash.
    return {
      title: "Cosmic Interference",
      description: "A solar flare is causing some interference with our long-range scanners. All event generation is temporarily offline.",
      choices: [
        { text: "Okay", outcome: { message: "You acknowledge the solar flare and continue on your journey." } },
        { text: "Understood", outcome: { message: "You decide to wait for the interference to clear. Your finances remain unchanged." } }
      ]
    };
  /*
  const financialContext = formatFinancialDataForPrompt(statement, accounts);
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
    if (!eventJson.choices || eventJson.choices.length !== 2) {
      throw new Error("AI did not generate two choices.");
    }
    return eventJson as CosmicEvent;
  } catch (error) {
    console.error("Error generating cosmic event:", error);
    return {
      title: "Signal Lost",
      description: "A solar flare interrupted our transmission from the opportunities quadrant! For now, the cosmos is quiet.",
      choices: [
        { text: "Stay Put", outcome: { message: "You decide to wait for the solar flare to pass. No changes to your finances." } },
        { text: "Continue Scanning", outcome: { message: "You use some energy to scan again, but find nothing new." } }
      ]
    };
  }
  */
};