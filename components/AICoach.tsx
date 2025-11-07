import React, { useState, useRef, useEffect } from 'react';
import { getAgentResponse } from '../services/geminiService';
import { Type } from "@google/genai";
import type { FunctionDeclaration } from "@google/genai";
import type { User, Transaction } from '../types';
import { TransactionType } from '../types';
import { CoachIcon, SendIcon, StarIcon } from './icons';

interface AICoachProps {
    user: User;
    actions: Record<string, (...args: any[]) => any>;
}

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

const tools: FunctionDeclaration[] = [
    {
        name: 'add_transaction',
        description: 'Logs a new income or expense transaction for the user.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                description: { type: Type.STRING, description: 'A brief summary of the transaction, e.g., "Groceries at Cosmic Mart" or "Salary".' },
                amount: { type: Type.NUMBER, description: 'The transaction amount as a positive number.' },
                type: { type: Type.STRING, description: 'The type of transaction, either "INCOME" or "EXPENSE".' },
                category: { type: Type.STRING, description: 'The budget category for the transaction, e.g., "Food", "Housing", "Job".' },
                is_passive: { type: Type.BOOLEAN, description: 'For income transactions, specifies if the income is passive (e.g., from investments, rent).' },
            },
            required: ['description', 'amount', 'type', 'category'],
        },
    },
];

export const AICoach: React.FC<AICoachProps> = ({ user, actions }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Welcome to the Coach's Corner! You can ask for advice or tell me to perform actions, like 'Log a $50 expense for gas'." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await getAgentResponse(input, user.financialStatement, user.accounts, tools);
            
            if (response.functionCalls && response.functionCalls.length > 0) {
                for (const fc of response.functionCalls) {
                    if (fc.name === 'add_transaction') {
                        // FIX: Cast arguments from function call to their expected types.
                        const { description, amount, type, category, is_passive } = fc.args as {
                            description: string;
                            amount: number;
                            type: TransactionType;
                            category: string;
                            is_passive?: boolean;
                        };
                        const primaryAccount = user.accounts.find(a => a.type === 'Checking') || user.accounts[0];

                        if (!primaryAccount) {
                             throw new Error("No primary account found to log the transaction against.");
                        }

                        const transactionData: Omit<Transaction, 'id'> = {
                            description,
                            amount,
                            type: type,
                            category,
                            isPassive: is_passive || false,
                            date: new Date().toISOString().split('T')[0],
                            paymentShares: [{ userId: user.id, accountId: primaryAccount.id, amount }],
                            expenseShares: type === TransactionType.EXPENSE ? [{ userId: user.id, amount }] : [],
                        };
                        
                        await actions.handleSaveTransaction(transactionData);
                        
                        const aiMessage: Message = { sender: 'ai', text: `Okay, I've logged a ${type.toLowerCase()} of $${amount} for "${description}".` };
                        setMessages(prev => [...prev, aiMessage]);
                    }
                }
            } else {
                 const aiMessage: Message = { sender: 'ai', text: response.text };
                 setMessages(prev => [...prev, aiMessage]);
            }

        } catch (error) {
            const errorMessage: Message = { sender: 'ai', text: (error as Error).message || "Sorry, I'm having trouble connecting to my cosmic wisdom. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };
    
    const suggestionPrompts = [
        "Add a $75 expense for 'Dinner' under 'Food'",
        "Log a passive income of $200 for 'Stock Dividend'",
        "What's my biggest expense category this month?",
        "How can I improve my cash flow?"
    ];

    const handleSuggestionClick = (prompt: string) => {
        setInput(prompt);
    };

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-100px)] animate-fade-in">
            <div className="p-4 border-b border-cosmic-border flex items-center gap-3">
                <CoachIcon className="w-8 h-8 text-cosmic-primary" />
                <div>
                    <h1 className="text-xl font-bold text-cosmic-text-primary">AI Financial Agent</h1>
                    <p className="text-cosmic-text-secondary">Your personal strategist for the tournament.</p>
                </div>
            </div>

            <div className="flex-grow p-4 overflow-y-auto space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-cosmic-primary flex items-center justify-center flex-shrink-0"><StarIcon className="w-5 h-5 text-white"/></div>}
                        <div className={`max-w-lg p-3 rounded-lg ${msg.sender === 'ai' ? 'bg-cosmic-surface text-cosmic-text-primary' : 'bg-cosmic-primary text-white'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-cosmic-primary flex items-center justify-center flex-shrink-0"><StarIcon className="w-5 h-5 text-white"/></div>
                        <div className="max-w-lg p-3 rounded-lg bg-cosmic-surface text-cosmic-text-primary">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cosmic-text-secondary rounded-full animate-pulse-fast"></div>
                                <div className="w-2 h-2 bg-cosmic-text-secondary rounded-full animate-pulse-fast animation-delay-200"></div>
                                <div className="w-2 h-2 bg-cosmic-text-secondary rounded-full animate-pulse-fast animation-delay-400"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {messages.length <= 1 && (
                <div className="px-4 pb-4">
                    <p className="text-sm text-cosmic-text-secondary mb-2">Not sure what to do? Try one of these:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestionPrompts.map(prompt => (
                            <button
                                key={prompt}
                                onClick={() => handleSuggestionClick(prompt)}
                                className="bg-cosmic-surface border border-cosmic-border text-cosmic-text-secondary text-sm px-3 py-1 rounded-full hover:bg-cosmic-border transition-colors">
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="p-4 border-t border-cosmic-border mt-auto">
                <div className="flex items-center gap-3 bg-cosmic-surface rounded-lg border border-cosmic-border focus-within:border-cosmic-primary transition-colors">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask for advice or issue a command..."
                        className="w-full bg-transparent p-3 text-cosmic-text-primary focus:outline-none"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || input.trim() === ''} className="p-3 text-cosmic-primary disabled:text-cosmic-text-secondary disabled:cursor-not-allowed">
                        <SendIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    );
};