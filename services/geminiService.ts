import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { FinancialStatement, CosmicEvent, Account } from '../types';
import { AccountType, TransactionType } from '../types';

let ai: GoogleGenAI | null = null;

// The environment variable for the Gemini API key is expected to be process.env.API_KEY
if (process.env.API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
  }
} else {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

function formatFinancialDataForPrompt(statement: FinancialStatement, accounts: Account[]): string {
    const totalIncome = statement.transactions
        .filter(t => t.type === TransactionType.INCOME && !t.isPassive)
        .reduce((sum, t) => sum + t.amount, 0);
    const passiveIncome = statement.transactions
        .filter(t => t.type === TransactionType.INCOME && t.isPassive)
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = statement.transactions
        .filter(t => t.type === TransactionType.EXPENSE)
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
    if (!ai) {
        console.warn("AI Coach is disabled because API key is not configured.");
        return "The AI Coach is temporarily offline. Please ensure the API key is configured.";
    }

    const fullPrompt = `
        ${formatFinancialDataForPrompt(statement, accounts)}
        User question: "${prompt}"
        Based on this, provide concise, actionable financial advice.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error getting financial advice from Gemini:", error);
        return "Sorry, I encountered an issue while trying to generate advice. Please try again later.";
    }
};

export const getCosmicEvent = async (statement: FinancialStatement, accounts: Account[]): Promise<CosmicEvent> => {
    if (!ai) {
        console.warn("Cosmic Event generation is disabled because API key is not configured.");
        return {
            title: "Cosmic Interference",
            description: "A solar flare is causing some interference with our long-range scanners. All event generation is temporarily offline.",
            choices: [
                { text: "Okay", outcome: { message: "You acknowledge the solar flare and continue on your journey." } },
                { text: "Understood", outcome: { message: "You decide to wait for the interference to clear. Your finances remain unchanged." } }
            ]
        };
    }

    const prompt = `
        ${formatFinancialDataForPrompt(statement, accounts)}
        Generate a "Cosmic Event" for a financial game. It should be a short scenario with 2-3 choices.
        Each choice leads to a clear outcome: a message, sometimes a cash change (positive or negative), or a new simple asset.
        The event should be interesting and related to finance, investing, or business, but with a fun, cosmic/sci-fi theme.
        The amounts should be reasonable based on the user's financial snapshot.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
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
                                            // FIX: Removed `nullable: true` as it's not a valid property in the responseSchema.
                                            // The property will be optional if it is not in the `required` array.
                                            cashChange: { type: Type.NUMBER },
                                        },
                                        required: ['message']
                                    },
                                },
                                required: ['text', 'outcome']
                            }
                        }
                    },
                    required: ['title', 'description', 'choices']
                }
            }
        });

        const jsonText = response.text.trim();
        const eventData = JSON.parse(jsonText);
        
        if (eventData.title && eventData.description && Array.isArray(eventData.choices)) {
            return eventData as CosmicEvent;
        } else {
            throw new Error("Generated event data is not in the expected format.");
        }

    } catch (error) {
        console.error("Error generating Cosmic Event:", error);
        return {
            title: "Transmission Error",
            description: "We've lost the signal from the event probe! It seems a cosmic anomaly interfered with the data stream.",
            choices: [
                { text: "Proceed cautiously", outcome: { message: "You decide to wait for a clearer signal. Your finances are unaffected." } }
            ]
        };
    }
};

export const parseStatementWithGemini = async (statementText: string) => {
    if (!ai) {
        throw new Error("AI parser is disabled because API key is not configured.");
    }

    const prompt = `
        Analyze the following bank statement text and extract all transactions.
        For each transaction, determine the date, a clean description, the amount, and whether it's an income or an expense.
        The date should be in YYYY-MM-DD format. Today's date is ${new Date().toLocaleDateString()}.
        If a year is not specified, assume the current year.
        Text to analyze:
        ---
        ${statementText}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transactions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    date: { type: Type.STRING, description: "Date in YYYY-MM-DD format." },
                                    description: { type: Type.STRING, description: "Cleaned-up transaction description." },
                                    amount: { type: Type.NUMBER, description: "The transaction amount as a positive number." },
                                    type: { type: Type.STRING, description: "Either 'income' or 'expense'." }
                                },
                                required: ['date', 'description', 'amount', 'type']
                            }
                        }
                    },
                    required: ['transactions']
                }
            }
        });

        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);
        
        if (parsedData.transactions && Array.isArray(parsedData.transactions)) {
            // Add a temporary ID for client-side rendering
            return parsedData.transactions.map((tx: any, index: number) => ({ ...tx, id: Date.now() + index }));
        }
        
        throw new Error("AI response did not contain a valid 'transactions' array.");

    } catch (error) {
        console.error("Error parsing statement with Gemini:", error);
        throw new Error("The AI failed to parse the statement. The text might be in an unsupported format.");
    }
};