import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { generateImage } from '../services/geminiService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useLocale } from '../hooks/useLocale';

type ImageSize = '1K' | '2K' | '4K';

const ImageGeneratorPage: React.FC = () => {
  const { t } = useLocale();
  const [prompt, setPrompt] = useState<string>('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [result, setResult] = useState<{ imageUrl: string; altText: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState(false);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio && (await window.aistudio.hasSelectedApiKey())) {
      setApiKeySelected(true);
    } else {
      setApiKeySelected(false);
    }
  }, []);

  useEffect(() => {
    void checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError(t('tool.imageGenerator.errorMissing'));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const generatedResult = await generateImage(prompt, imageSize);
      setResult(generatedResult);
    } catch (e: any) {
      let errorMessage = e?.message || t('error.title');
      if (String(errorMessage).includes('Requested entity was not found')) {
        errorMessage = t('tool.imageGenerator.errorKey');
        setApiKeySelected(false);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!apiKeySelected) {
    return (
      <div className="container mx-auto max-w-xl text-center animate-fadeIn">
        <div className="rounded-2xl bg-brand-secondary p-6 shadow-lg md:p-8">
          <h1 className="text-3xl font-extrabold text-brand-text">{t('tool.imageGenerator.apiTitle')}</h1>
          <p className="mb-6 mt-4 text-brand-text-secondary">{t('tool.imageGenerator.apiDesc')}</p>
          <button
            onClick={handleSelectKey}
            className="w-full rounded-lg bg-brand-accent px-6 py-3 font-semibold transition-colors hover:bg-brand-accent-light"
          >
            {t('tool.imageGenerator.selectKey')}
          </button>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-brand-accent hover:underline"
          >
            {t('tool.imageGenerator.learnBilling')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl animate-fadeIn">
      <Link to="/" className="mb-4 inline-block text-brand-accent hover:underline">
        &larr; {t('common.backTools')}
      </Link>
      <div className="rounded-2xl bg-brand-secondary p-6 shadow-lg md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-brand-text md:text-4xl">{t('tool.imageGenerator.title')}</h1>
          <p className="mt-2 text-brand-text-secondary">{t('tool.imageGenerator.subtitle')}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="prompt" className="mb-2 block text-sm font-medium text-brand-text-secondary">
              {t('tool.imageGenerator.prompt')}
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('tool.imageGenerator.promptHint')}
              className="w-full rounded-lg border border-brand-secondary bg-brand-primary p-3 text-brand-text outline-none transition focus:ring-2 focus:ring-brand-accent"
              rows={4}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-text-secondary">{t('tool.imageGenerator.quality')}</label>
            <div className="flex gap-4">
              {(['1K', '2K', '4K'] as ImageSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setImageSize(size)}
                  className={`w-full rounded-lg p-3 font-semibold transition-colors ${
                    imageSize === size ? 'bg-brand-accent text-white' : 'bg-brand-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !prompt.trim()}
            className="w-full rounded-lg bg-brand-accent px-6 py-3 font-semibold transition-colors hover:bg-brand-accent-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t('tool.imageGenerator.loading') : t('common.generate')}
          </button>
        </div>
      </div>

      {loading && <Loading message={t('tool.imageGenerator.loading')} />}
      {error && <ErrorMessage message={error} onRetry={handleSubmit} />}
      {result && (
        <div className="mt-6 rounded-2xl bg-brand-secondary p-6">
          <h2 className="mb-4 text-2xl font-bold text-brand-text">{t('tool.imageGenerator.resultTitle')}</h2>
          <img src={result.imageUrl} alt={result.altText} className="w-full rounded-lg" />
          <p className="mt-2 text-sm italic text-brand-text-secondary">{result.altText}</p>
        </div>
      )}
    </div>
  );
};

export default ImageGeneratorPage;
