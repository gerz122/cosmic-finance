// FIX: Removed non-exported member 'LiveSession' from import.
import { GoogleGenAI, Type, GenerateContentResponse, LiveServerMessage, Modality, Blob, FunctionDeclaration } from "@google/genai";
import type { FinancialStatement, CosmicEvent, Account } from '../types';
import { AccountType, TransactionType } from '../types';

const getAiInstance = () => {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("VITE_GEMINI_API_KEY not found in environment variables. AI features will be disabled.");
        return null;
    }
    try {
        return new GoogleGenAI({ apiKey });
    } catch (error) {
        console.error("Failed to initialize GoogleGenAI:", error);
        return null;
    }
};

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
    const ai = getAiInstance();
    if (!ai) {
        throw new Error("AI Coach is disabled because API key is not configured.");
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
        throw new Error("Sorry, I encountered an issue while trying to generate advice. Please try again later.");
    }
};

export const getAgentResponse = async (prompt: string, statement: FinancialStatement, accounts: Account[], tools: FunctionDeclaration[], useGoogleSearch: boolean): Promise<GenerateContentResponse> => {
    const ai = getAiInstance();
    if (!ai) {
        throw new Error("AI Coach is disabled because API key is not configured.");
    }

    const fullPrompt = `
        ${formatFinancialDataForPrompt(statement, accounts)}
        The current date is ${new Date().toLocaleDateString()}.
        User request: "${prompt}"
    `;
    
    const config: any = {};
    if (useGoogleSearch) {
        config.tools = [{ googleSearch: {} }];
    } else if (tools.length > 0) {
        config.tools = [{ functionDeclarations: tools }];
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config,
        });
        return response;
    } catch (error) {
        console.error("Error getting agent response from Gemini:", error);
        throw new Error("Sorry, the AI agent encountered an error. Please try again.");
    }
};


export const getCosmicEvent = async (statement: FinancialStatement, accounts: Account[]): Promise<CosmicEvent> => {
    const ai = getAiInstance();
    if (!ai) {
       throw new Error("Cosmic Event generation is disabled because API key is not configured.");
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
         throw new Error("The AI failed to generate a Cosmic Event. The transmission may have been interrupted.");
    }
};

const analysisTools: FunctionDeclaration[] = [
    {
        name: 'add_transaction',
        description: 'Records a single financial transaction (income or expense).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                date: { type: Type.STRING, description: 'Date of the transaction in YYYY-MM-DD format.' },
                description: { type: Type.STRING, description: 'A brief, clear summary of the transaction.' },
                amount: { type: Type.NUMBER, description: 'The transaction amount as a positive number.' },
                type: { type: Type.STRING, description: 'Either "INCOME" or "EXPENSE".' },
                category: { type: Type.STRING, description: 'A suitable budget category (e.g., Food, Housing, Job).' },
                is_passive: { type: Type.BOOLEAN, description: 'For income, is it from passive sources?' },
                account_name: { type: Type.STRING, description: 'The name of the account the transaction belongs to, e.g., "Checking", "Credit Card".' }
            },
            required: ['date', 'description', 'amount', 'type', 'category', 'account_name']
        }
    },
    {
        name: 'create_account',
        description: 'Proposes the creation of a new bank account, credit card, etc.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'The name for the new account, e.g., "Emergency Fund Savings".' },
                type: { type: Type.STRING, description: `The account type. Must be one of: ${Object.values(AccountType).join(', ')}.` },
                initial_balance: { type: Type.NUMBER, description: 'The starting balance of the account.' },
            },
            required: ['name', 'type', 'initial_balance']
        }
    },
    {
        name: 'create_team',
        description: 'Proposes the creation of a new team for a project or business.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING, description: 'The name for the new team or project.' }
            },
            required: ['name']
        }
    }
];

export const analyzeTextWithTools = async (textToAnalyze: string): Promise<GenerateContentResponse> => {
    const ai = getAiInstance();
    if (!ai) {
        throw new Error("AI parser is disabled because API key is not configured.");
    }
    const prompt = `
        Analyze the following text. Identify and extract all financial actions such as creating accounts, logging transactions, or creating teams.
        The current date is ${new Date().toLocaleDateString()}. If a year is not specified for a transaction, assume the current year.
        Use the available tools to structure the output for each action you identify.
        You can call the tools multiple times if you find multiple actions.
        For transactions, try to infer the account name (e.g., "Checking", "Visa", "Amex"). If not specified, use a sensible default like "Checking".
        
        Text to analyze:
        ---
        ${textToAnalyze}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ functionDeclarations: analysisTools }]
            }
        });
        return response;
    } catch (error) {
        console.error("Error analyzing text with Gemini tools:", error);
        throw new Error("The AI failed to analyze the text. The format might be unsupported.");
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
    const ai = getAiInstance();
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