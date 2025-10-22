import { GoogleGenAI } from "@google/genai";
import type { FinancialStatement } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function formatFinancialDataForPrompt(statement: FinancialStatement): string {
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

    return `
      Current Financial Snapshot:
      - Monthly Active Income: $${totalIncome.toFixed(2)}
      - Monthly Passive Income: $${passiveIncome.toFixed(2)}
      - Monthly Expenses: $${totalExpenses.toFixed(2)}
      - Total Assets: $${statement.assets.reduce((sum, a) => sum + a.value, 0).toFixed(2)}
      - Total Liabilities: $${statement.liabilities.reduce((sum, l) => sum + l.balance, 0).toFixed(2)}
      - Net Worth: $${netWorth.toFixed(2)}
      The user is playing a financial game where the goal is for passive income to exceed total expenses.
    `;
}

export const getFinancialAdvice = async (prompt: string, statement: FinancialStatement): Promise<string> => {
  try {
    const fullPrompt = `
      You are an expert financial coach in a game called 'Cosmic Cashflow'. Your advice should be encouraging, strategic, and use the game's fun, cosmic/sports-themed language (e.g., 'goal', 'foul', 'dribble past debt', 'cosmic win').

      Here is the player's current situation:
      ${formatFinancialDataForPrompt(statement)}

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
