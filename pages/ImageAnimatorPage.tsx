import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { animateImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileToBase64';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useLocale } from '../hooks/useLocale';

const ImageAnimatorPage: React.FC = () => {
  const { t } = useLocale();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setVideoUrl('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!imageFile || !prompt.trim()) {
      setError(t('tool.imageAnimator.errorMissing'));
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl('');

    try {
      const imageBase64 = await fileToBase64(imageFile);
      const generatedVideoUrl = await animateImage(prompt, imageBase64, imageFile.type, aspectRatio, setLoadingMessage);
      setVideoUrl(generatedVideoUrl);
    } catch (e: any) {
      let errorMessage = e?.message || t('error.title');
      if (String(errorMessage).includes('Requested entity was not found')) {
        errorMessage = t('tool.imageAnimator.errorKey');
        setApiKeySelected(false);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  if (!apiKeySelected) {
    return (
      <div className="container mx-auto max-w-xl text-center animate-fadeIn">
        <div className="rounded-2xl bg-brand-secondary p-6 shadow-lg md:p-8">
          <h1 className="text-3xl font-extrabold text-brand-text">{t('tool.imageAnimator.apiTitle')}</h1>
          <p className="mb-6 mt-4 text-brand-text-secondary">{t('tool.imageAnimator.apiDesc')}</p>
          <button
            onClick={handleSelectKey}
            className="w-full rounded-lg bg-brand-accent px-6 py-3 font-semibold transition-colors hover:bg-brand-accent-light"
          >
            {t('tool.imageAnimator.selectKey')}
          </button>
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-brand-accent hover:underline"
          >
            {t('tool.imageAnimator.learnBilling')}
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
          <h1 className="text-3xl font-extrabold text-brand-text md:text-4xl">{t('tool.imageAnimator.title')}</h1>
          <p className="mt-2 text-brand-text-secondary">{t('tool.imageAnimator.subtitle')}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="image-upload" className="mb-2 block text-sm font-medium text-brand-text-secondary">
              {t('tool.imageAnimator.upload')}
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-brand-text-secondary file:mr-4 file:rounded-full file:border-0 file:bg-brand-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-accent-light"
            />
          </div>

          {imagePreview && <img src={imagePreview} alt="Preview" className="mx-auto max-h-64 rounded-lg object-contain" />}

          <div>
            <label htmlFor="prompt" className="mb-2 block text-sm font-medium text-brand-text-secondary">
              {t('tool.imageAnimator.prompt')}
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('tool.imageAnimator.promptHint')}
              className="w-full rounded-lg border border-brand-secondary bg-brand-primary p-3 text-brand-text outline-none transition focus:ring-2 focus:ring-brand-accent"
              rows={3}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-text-secondary">{t('tool.imageAnimator.aspect')}</label>
            <div className="flex gap-4">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`w-full rounded-lg p-3 font-semibold transition-colors ${
                  aspectRatio === '16:9' ? 'bg-brand-accent text-white' : 'bg-brand-primary'
                }`}
              >
                {t('tool.imageAnimator.landscape')}
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`w-full rounded-lg p-3 font-semibold transition-colors ${
                  aspectRatio === '9:16' ? 'bg-brand-accent text-white' : 'bg-brand-primary'
                }`}
              >
                {t('tool.imageAnimator.portrait')}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !imageFile || !prompt.trim()}
            className="w-full rounded-lg bg-brand-accent px-6 py-3 font-semibold transition-colors hover:bg-brand-accent-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t('tool.imageAnimator.loading') : t('common.generate')}
          </button>
        </div>
      </div>

      {loading && <Loading message={loadingMessage || t('tool.imageAnimator.loadingDefault')} />}
      {error && <ErrorMessage message={error} onRetry={handleSubmit} />}
      {videoUrl && (
        <div className="mt-6 rounded-2xl bg-brand-secondary p-6">
          <h2 className="mb-4 text-2xl font-bold text-brand-text">{t('tool.imageAnimator.resultTitle')}</h2>
          <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default ImageAnimatorPage;
