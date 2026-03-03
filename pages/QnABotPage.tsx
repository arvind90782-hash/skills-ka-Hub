
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Bot, User, Search, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

interface GroundingSource {
    uri: string;
    title: string;
}
interface Message {
    sender: 'user' | 'bot';
    text: string;
    sources?: GroundingSource[];
}

const QnABotPage: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY ||
                (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_KEY);
            if (!API_KEY) {
                throw new Error("API_KEY environment variable not set. Please add a key to .env.");
            }
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            const chatSession = ai.chats.create({
                model: 'gemini-3-flash-preview',
                config: {
                    systemInstruction: 'You are AI Dost, a friendly and helpful AI assistant for students learning freelancer skills. Your answers should be encouraging, clear, and in Hinglish. You have access to Google Search, so use it for recent or specific topics.',
                    tools: [{ googleSearch: {} }]
                },
            });
            setChat(chatSession);
            setMessages([{ sender: 'bot', text: 'Namaste! Main hoon AI Dost, ab Google Search ki shakti ke saath. Aapka koi bhi sawal ho, yahan pooch sakte hain.' }]);
        } catch (e: any) {
            setError(e.message || "Chat shuru karne mein dikkat aa rahi hai.");
        }
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInput.trim() || !chat || isLoading) return;

        const userMessage: Message = { sender: 'user', text: userInput };
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);

        setMessages(prev => [...prev, userMessage, { sender: 'bot', text: '' }]);

        try {
            const stream = await chat.sendMessageStream({ message: currentInput });
            
            for await (const chunk of stream) {
                const c = chunk as GenerateContentResponse;
                const chunkText = c.text;
                const groundingChunks = c.candidates?.[0]?.groundingMetadata?.groundingChunks;
                const sources: GroundingSource[] = groundingChunks
                    ?.map((gc: any) => gc.web)
                    .filter((web: any) => web && web.uri && web.title) || [];
                
                if (chunkText) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        lastMessage.text += chunkText;
                        if (sources.length > 0) {
                            lastMessage.sources = [...(lastMessage.sources || []), ...sources].filter((v,i,a)=>a.findIndex(t=>(t.uri === v.uri))===i);
                        }
                        return newMessages;
                    });
                }
            }

        } catch (e: any) {
            const errorMessage: Message = { sender: 'bot', text: "Sorry, kuch gadbad ho gayi. Thodi der baad try karein." };
            setMessages(prev => [...prev.slice(0, -1), errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col">
            <Link to="/" className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-brand-accent mb-6 transition-colors group">
                <div className="p-2 rounded-full ios-glass group-hover:bg-brand-accent group-hover:text-white transition-all">
                    <ArrowLeft size={18} />
                </div>
                <span className="font-semibold">Sabhi Tools</span>
            </Link>

            <div className="ios-card flex-grow flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-brand-text-secondary/10 ios-glass z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent shadow-inner">
                            <Bot size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-brand-text tracking-tight flex items-center gap-2">
                                AI Dost
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    <Sparkles size={18} className="text-amber-400" />
                                </motion.div>
                            </h1>
                            <p className="text-sm text-brand-text-secondary font-medium flex items-center gap-1">
                                <Search size={12} /> Google Search Powered Assistant
                            </p>
                        </div>
                    </div>
                </div>
                
                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-500/10 text-red-500 text-center font-bold text-sm"
                    >
                        {error}
                    </motion.div>
                )}

                {/* Chat Container */}
                <div 
                    ref={chatContainerRef} 
                    className="flex-grow p-6 space-y-6 overflow-y-auto scroll-smooth custom-scrollbar"
                >
                    <AnimatePresence initial={false}>
                        {messages.map((msg, index) => (
                            <motion.div 
                                key={index} 
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                                    msg.sender === 'user' ? 'bg-brand-accent text-white' : 'bg-brand-primary text-brand-accent'
                                }`}>
                                    {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                                </div>

                                <div className={`max-w-[80%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                                        msg.sender === 'user' 
                                            ? 'bg-brand-accent text-white rounded-tr-none' 
                                            : 'ios-glass text-brand-text rounded-tl-none border-brand-accent/10'
                                    }`}>
                                        {msg.text === '' && isLoading ? (
                                            <div className="flex gap-1 py-2">
                                                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                                                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                                                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
                                            </div>
                                        ) : (
                                            <div className="space-y-2 leading-relaxed">
                                                {msg.text.split('\n').map((line, i) => (
                                                    <p key={i} className={line.trim() === '' ? 'h-2' : ''}>{line}</p>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {msg.sources && msg.sources.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-wrap gap-2 pt-1"
                                        >
                                            {msg.sources.map((source, i) => (
                                                <a 
                                                    key={i} 
                                                    href={source.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ios-glass text-[10px] font-black uppercase tracking-wider text-brand-accent hover:bg-brand-accent hover:text-white transition-all"
                                                >
                                                    <ExternalLink size={10} />
                                                    {new URL(source.uri).hostname.replace('www.', '')}
                                                </a>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Input Area */}
                <div className="p-6 ios-glass border-t border-brand-text-secondary/10">
                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                placeholder="Apna sawal yahan type karein..."
                                className="w-full bg-brand-primary/50 border-2 border-transparent focus:border-brand-accent/30 rounded-2xl py-4 pl-6 pr-14 text-brand-text placeholder:text-brand-text-secondary/50 outline-none transition-all duration-300 shadow-inner"
                                disabled={isLoading || !chat}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-accent/30">
                                <Sparkles size={20} />
                            </div>
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit" 
                            disabled={isLoading || !userInput.trim()} 
                            className="p-4 bg-brand-accent text-white rounded-2xl shadow-lg shadow-brand-accent/30 disabled:opacity-30 disabled:grayscale transition-all"
                        >
                            {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                        </motion.button>
                    </form>
                    <p className="text-[10px] text-center mt-4 text-brand-text-secondary font-bold uppercase tracking-[0.2em] opacity-50">
                        AI Dost can make mistakes. Check important info.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default QnABotPage;
