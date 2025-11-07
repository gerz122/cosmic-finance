// FIX: Removed non-exported member 'LiveSession' from import.
import { GoogleGenAI, Type, GenerateContentResponse, LiveServerMessage, Modality, Blob } from "@google/genai";
import type { FinancialStatement, CosmicEvent, Account } from '../types';
import { AccountType, TransactionType } from '../types';

let ai: GoogleGenAI | null = null;
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
  }
} else {
  console.warn("VITE_GEMINI_API_KEY not found in environment variables. AI features will be disabled.");
}

// --- Audio Utility Functions for Live API ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
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
        Also, determine if an income is 'isPassive' (like dividends, rent) and if a transaction is a 'isTransfer' between accounts.
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
                                    type: { type: Type.STRING, description: "Either 'income' or 'expense'." },
                                    isPassive: { type: Type.BOOLEAN, description: "True if the income is from passive sources like dividends or rent." },
                                    isTransfer: { type: Type.BOOLEAN, description: "True if this is likely a transfer between accounts." }
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

// --- Live Assistant Service ---

export const connectLiveAssistant = (callbacks: {
    onopen: () => void,
    onmessage: (message: LiveServerMessage) => void,
    onerror: (e: ErrorEvent) => void,
    onclose: (e: CloseEvent) => void,
// FIX: Updated return type to use 'any' as 'LiveSession' is not an exported member.
}, statement: FinancialStatement, accounts: Account[]): Promise<any> => {
    if (!ai) {
        throw new Error("AI Coach is disabled because API key is not configured.");
    }
    
    const financialContext = formatFinancialDataForPrompt(statement, accounts);

    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: `You are a friendly and helpful financial assistant for the game Cosmic Cashflow. Your goal is to provide concise, actionable advice based on the user's financial data. Keep your answers brief and conversational. Here is the user's current financial data: ${financialContext}`,
        },
    });
};