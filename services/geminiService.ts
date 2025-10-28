
import { GoogleGenAI, Type } from "@google/genai";
import type { FinancialStatement, CosmicEvent, Account } from '../types';
import { AccountType } from '../types';

// CRITICAL FIX: The AI client is disabled to prevent the API_KEY error on Vercel.
// The app will run without AI features until this is re-enabled with a working API key setup.
// const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });


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
};
