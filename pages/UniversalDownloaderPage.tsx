import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ArrowLeft, Loader2, ShieldAlert } from 'lucide-react';
import ErrorMessage from '../components/ErrorMessage';
import { useLocale } from '../hooks/useLocale';

type QualityOption = 'best' | '1080p' | '720p' | '480p';

const UniversalDownloaderPage: React.FC = () => {
  const { t } = useLocale();
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<QualityOption>('best');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Link daalo pehle.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/downloader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), quality }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Download failed (${res.status})`);
      }

      const data = json.data as { base64: string; mimeType: string; fileName: string };
      const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: data.mimeType || 'application/octet-stream' });
      const fileUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = data.fileName || `download-${Date.now()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(fileUrl);

      setSuccess('Download start ho gaya.');
    } catch (e: any) {
      setError(e?.message || 'Download me issue aaya.');
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
          <h1 className="text-3xl font-extrabold text-brand-text md:text-4xl">Media Downloader</h1>
          <p className="mt-2 text-brand-text-secondary">
            Direct media link (image/video/audio) daalo aur download karo. Sirf legal/authorized content ke liye use karo.
          </p>
        </div>

        <div className="mb-5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-300">
          <div className="mb-2 inline-flex items-center gap-2 font-bold">
            <ShieldAlert size={16} />
            Safety Notice
          </div>
          <p>
            YouTube/Facebook/Pinterest jaise platforms ke protected links tool me intentionally blocked hain. Official platform download options use karo.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-brand-text-secondary">Media Link</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/file.mp4"
              className="w-full rounded-lg border border-brand-secondary bg-brand-primary p-3 text-brand-text outline-none transition focus:ring-2 focus:ring-brand-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-text-secondary">Quality Preference</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as QualityOption)}
              className="w-full rounded-lg border border-brand-secondary bg-brand-primary p-3 text-brand-text outline-none transition focus:ring-2 focus:ring-brand-accent"
            >
              <option value="best">Best Available</option>
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
              <option value="480p">480p</option>
            </select>
          </div>

          <button
            onClick={handleDownload}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-accent-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {loading ? 'Preparing...' : 'Download'}
          </button>
        </div>
      </div>

      {success && <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{success}</p>}
      {error && (
        <div className="mt-4">
          <ErrorMessage message={error} onRetry={handleDownload} />
        </div>
      )}
    </div>
  );
};

export default UniversalDownloaderPage;
