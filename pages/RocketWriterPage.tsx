import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { generateFastText } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import CopyButton from '../components/CopyButton';
// FIX: Import the ErrorMessage component.
import ErrorMessage from '../components/ErrorMessage';
import { useLocale } from '../hooks/useLocale';

const RocketWriterPage: React.FC = () => {
    const { t } = useLocale();
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

    const runGeneration = useCallback(async () => {
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
            setError(e.message || t('tool.rocketWriter.error'));
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, prompt, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await runGeneration();
    };

    return (
        <div className="container mx-auto max-w-3xl animate-fadeIn">
            <Link to="/" className="text-brand-accent hover:underline mb-4 inline-block">&larr; {t('common.backTools')}</Link>
            <div className="bg-brand-secondary rounded-2xl shadow-lg p-6 md:p-8">
                <div className="text-center mb-6">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-brand-text">{t('tool.rocketWriter.title')}</h1>
                    <p className="text-brand-text-secondary mt-2">{t('tool.rocketWriter.subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">{t('tool.rocketWriter.prompt')}</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('tool.rocketWriter.promptHint')}
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
                        {isLoading ? t('tool.rocketWriter.loading') : t('common.generate')}
                    </button>
                </form>
            </div>

            {error && (
                <div className="mt-6">
                    <ErrorMessage message={error} onRetry={() => { void runGeneration(); }} />
                </div>
            )}
            
            {(result || isLoading) && (
                <div className="mt-6 bg-brand-secondary rounded-2xl p-6 relative">
                    <h2 className="text-2xl font-bold text-brand-text mb-4">{t('common.results')}</h2>
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
