import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import PageBackButton from '../components/PageBackButton';
import { useLocale } from '../hooks/useLocale';
import AiGenerationMeta from '../components/AiGenerationMeta';
import CopyButton from '../components/CopyButton';
import { Download, RefreshCw } from 'lucide-react';

type ImageSize = '1K' | '2K' | '4K';
type AspectRatio = '1:1' | '16:9' | '9:16';

const ImageGeneratorPage: React.FC = () => {
  const { t } = useLocale();
  const [prompt, setPrompt] = useState<string>('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [style, setStyle] = useState('cinematic');
  const [result, setResult] = useState<{ imageUrl: string; altText: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError(t('tool.imageGenerator.errorMissing'));
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const generatedResult = await generateImage(prompt, imageSize, {
        toolId: 'image-generator',
        aspectRatio,
        style,
      });
      setResult(generatedResult);
    } catch (e: any) {
      setError(e?.message || t('error.title'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl animate-fadeIn">
      <PageBackButton label={t('common.backTools')} fallbackTo="/tools" className="mb-4" />
      <div className="rounded-2xl bg-brand-secondary p-6 shadow-lg md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-brand-text md:text-4xl">{t('tool.imageGenerator.title')}</h1>
          <p className="mt-2 text-brand-text-secondary">{t('tool.imageGenerator.subtitle')}</p>
        </div>

        <div className="space-y-6">
          <AiGenerationMeta toolId="image-generator" progressLabel={loading ? 'Generating a production-ready image...' : undefined} />

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

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-brand-text-secondary">{t('tool.imageGenerator.quality')}</label>
              <div className="flex gap-2">
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

            <div>
              <label className="mb-2 block text-sm font-medium text-brand-text-secondary">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="w-full rounded-lg border border-brand-secondary bg-brand-primary p-3 text-brand-text outline-none transition focus:ring-2 focus:ring-brand-accent"
              >
                <option value="1:1">Square</option>
                <option value="16:9">Landscape</option>
                <option value="9:16">Portrait</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-brand-text-secondary">Style</label>
              <input
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                placeholder="cinematic, photoreal, anime..."
                className="w-full rounded-lg border border-brand-secondary bg-brand-primary p-3 text-brand-text outline-none transition focus:ring-2 focus:ring-brand-accent"
              />
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
        <div className="relative mt-6 rounded-2xl bg-brand-secondary p-6">
          <h2 className="mb-4 text-2xl font-bold text-brand-text">{t('tool.imageGenerator.resultTitle')}</h2>
          <CopyButton textToCopy={result.altText} />
          <img src={result.imageUrl} alt={result.altText} className="w-full rounded-lg" />
          <p className="mt-2 text-sm italic text-brand-text-secondary">{result.altText}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={result.imageUrl}
              download={`skills-hub-${Date.now()}.png`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white"
            >
              <Download size={16} />
              Download
            </a>
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-text-secondary/20 bg-brand-primary px-4 py-2 font-semibold text-brand-text"
            >
              <RefreshCw size={16} />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGeneratorPage;
