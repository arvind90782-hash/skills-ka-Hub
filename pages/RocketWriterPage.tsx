import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateFastText } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import CopyButton from '../components/CopyButton';
// FIX: Import the ErrorMessage component.
import ErrorMessage from '../components/ErrorMessage';

const RocketWriterPage: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const resultRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (resultRef.current) {
            resultRef.current.scrollTop = resultRef.current.scrollHeight;
        }
    }, [result]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const stream = await generateFastText(prompt);
            for await (const chunk of stream) {
                const c = chunk as GenerateContentResponse;
                const chunkText = c.text;
                if(chunkText) {
                    setResult(prev => prev + chunkText);
                }
            }
        } catch (e: any) {
            setError(e.message || "Rocket Writer mein kuch gadbad ho gayi.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-3xl animate-fadeIn">
            <Link to="/" className="text-brand-accent hover:underline mb-4 inline-block">&larr; Sabhi tools par wapas</Link>
            <div className="bg-brand-secondary rounded-2xl shadow-lg p-6 md:p-8">
                <div className="text-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-brand-text">Rocket Writer</h1>
                    <p className="text-brand-text-secondary mt-2">Turant jawab, bina intezaar kiye.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">Aapko kya likhwana hai?</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Jaise: 5 creative taglines for a coffee shop"
                            className="w-full bg-brand-primary border border-brand-secondary rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent outline-none transition"
                            rows={3}
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !prompt.trim()}
                        className="w-full px-6 py-3 bg-brand-accent rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent-light transition-colors"
                    >
                        {isLoading ? 'Likha jaa raha hai...' : 'Generate Karein'}
                    </button>
                </form>
            </div>

            {error && (
                <div className="mt-6">
                    <ErrorMessage message={error} onRetry={() => handleSubmit(new Event('submit') as any)} />
                </div>
            )}
            
            {(result || isLoading) && (
                <div className="mt-6 bg-brand-secondary rounded-2xl p-6 relative">
                    <h2 className="text-2xl font-bold text-brand-text mb-4">Natija</h2>
                    <div ref={resultRef} className="text-brand-text-secondary whitespace-pre-wrap bg-brand-primary p-4 rounded-md max-h-96 overflow-y-auto">
                        {result}
                        {isLoading && <span className="inline-block w-2 h-4 bg-brand-text animate-pulse ml-1"></span>}
                    </div>
                    {!isLoading && result && <CopyButton textToCopy={result} />}
                </div>
            )}
        </div>
    );
};

export default RocketWriterPage;