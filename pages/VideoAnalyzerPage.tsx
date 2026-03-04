import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyzeVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileToBase64';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import { useLocale } from '../hooks/useLocale';

const VideoAnalyzerPage: React.FC = () => {
  const { t } = useLocale();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Is video ka summary batao.');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setResult('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!videoFile || !prompt.trim()) {
      setError(t('tool.videoAnalyzer.errorMissing'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult('');

    try {
      const videoBase64 = await fileToBase64(videoFile);
      const analysisResult = await analyzeVideo(prompt, videoBase64, videoFile.type);
      setResult(analysisResult);
    } catch (e: any) {
      setError(e?.message || t('error.title'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl animate-fadeIn">
      <Link to="/" className="mb-4 inline-block text-brand-accent hover:underline">
        &larr; {t('common.backTools')}
      </Link>
      <div className="rounded-2xl bg-brand-secondary p-6 shadow-lg md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-brand-text md:text-4xl">{t('tool.videoAnalyzer.title')}</h1>
          <p className="mt-2 text-brand-text-secondary">{t('tool.videoAnalyzer.subtitle')}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="video-upload" className="mb-2 block text-sm font-medium text-brand-text-secondary">
              {t('tool.videoAnalyzer.upload')}
            </label>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-brand-text-secondary file:mr-4 file:rounded-full file:border-0 file:bg-brand-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-accent-light"
            />
          </div>

          {videoPreview && (
            <div className="flex justify-center rounded-lg bg-brand-primary">
              <video src={videoPreview} controls className="max-h-72 rounded-lg" />
            </div>
          )}

          <div>
            <label htmlFor="prompt" className="mb-2 block text-sm font-medium text-brand-text-secondary">
              {t('common.askQuestion')}
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('tool.videoAnalyzer.ask')}
              className="w-full rounded-lg border border-brand-secondary bg-brand-primary p-3 text-brand-text outline-none transition focus:ring-2 focus:ring-brand-accent"
              rows={3}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !videoFile}
            className="w-full rounded-lg bg-brand-accent px-6 py-3 font-semibold transition-colors hover:bg-brand-accent-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t('common.analyzing') : t('common.analyze')}
          </button>
        </div>
      </div>

      {loading && <Loading message={t('tool.videoAnalyzer.loading')} />}
      {error && <ErrorMessage message={error} onRetry={handleSubmit} />}
      {result && (
        <div className="mt-6 rounded-2xl bg-brand-secondary p-6">
          <h2 className="mb-4 text-2xl font-bold text-brand-text">{t('tool.videoAnalyzer.resultTitle')}</h2>
          <p className="whitespace-pre-wrap text-brand-text-secondary">{result}</p>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyzerPage;
