import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowLeft, Upload, Sparkles, Wand2, Search, Loader2, Image as ImageIcon } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileToBase64';
import ErrorMessage from '../components/ErrorMessage';
import { useLocale } from '../hooks/useLocale';

const ImageAnalyzerPage: React.FC = () => {
  const { t } = useLocale();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(t('tool.imageAnalyzer.ask'));
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult('');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!imageFile || !prompt.trim()) {
      setError(t('tool.imageAnalyzer.errorMissing'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult('');

    try {
      const imageBase64 = await fileToBase64(imageFile);
      const analysisResult = await analyzeImage(prompt, imageBase64, imageFile.type);
      setResult(analysisResult);
    } catch (e: any) {
      setError(e?.message || t('error.title'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl pb-20">
      <Link
        to="/"
        className="group mb-8 inline-flex items-center gap-2 text-brand-text-secondary transition-colors hover:text-brand-accent"
      >
        <div className="rounded-full p-2 ios-glass transition-all group-hover:bg-brand-accent group-hover:text-white">
          <ArrowLeft size={20} />
        </div>
        <span className="font-semibold">{t('common.backTools')}</span>
      </Link>

      <div className="ios-card overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-accent">
                <Camera size={12} /> Visual Intelligence
              </div>
              <h1 className="text-4xl font-black leading-none tracking-tighter text-brand-text md:text-5xl">
                {t('tool.imageAnalyzer.title')}
              </h1>
              <p className="text-lg font-medium text-brand-text-secondary">{t('tool.imageAnalyzer.subtitle')}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-accent/10 text-brand-accent shadow-inner">
                <ImageIcon size={40} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-brand-text-secondary opacity-50">
                  {t('tool.imageAnalyzer.step1')}
                </label>
                <div className="group relative">
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[var(--radius-ios-lg)] border-4 border-dashed border-brand-accent/20 bg-brand-primary/30 transition-all hover:border-brand-accent/40 hover:bg-brand-accent/5 group-hover:text-brand-accent"
                  >
                    {imagePreview ? (
                      <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-brand-text-secondary transition-colors">
                        <div className="rounded-full p-6 ios-glass">
                          <Upload size={32} />
                        </div>
                        <span className="font-bold">{t('tool.imageAnalyzer.upload')}</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-brand-text-secondary opacity-50">
                  {t('tool.imageAnalyzer.step2')}
                </label>
                <div className="relative">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('tool.imageAnalyzer.ask')}
                    className="min-h-[120px] w-full rounded-2xl border-2 border-transparent bg-brand-primary/50 p-6 text-brand-text shadow-inner outline-none transition-all duration-300 placeholder:text-brand-text-secondary/50 focus:border-brand-accent/30"
                  />
                  <div className="absolute bottom-4 right-4 text-brand-accent/20">
                    <Sparkles size={24} />
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading || !imageFile}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-accent py-5 text-lg font-black text-white shadow-xl shadow-brand-accent/30 transition-all disabled:opacity-30 disabled:grayscale"
              >
                {loading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    {t('common.analyzing')}
                  </>
                ) : (
                  <>
                    <Wand2 size={24} />
                    {t('common.analyze')}
                  </>
                )}
              </motion.button>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-brand-text-secondary opacity-50">
                {t('tool.imageAnalyzer.resultLabel')}
              </label>
              <div className="relative min-h-[400px] overflow-hidden rounded-[var(--radius-ios-lg)] p-8 ios-glass">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center space-y-6 p-12 text-center"
                    >
                      <div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                          className="h-24 w-24 rounded-full border-4 border-brand-accent/20 border-t-brand-accent"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 flex items-center justify-center text-brand-accent"
                        >
                          <Search size={32} />
                        </motion.div>
                      </div>
                      <p className="text-xl font-bold tracking-tight text-brand-text">{t('tool.imageAnalyzer.loadingHint')}</p>
                    </motion.div>
                  ) : result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center gap-2 text-brand-accent">
                        <Sparkles size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">{t('tool.imageAnalyzer.insight')}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-lg leading-relaxed text-brand-text">{result}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-brand-text-secondary/30"
                    >
                      <ImageIcon size={64} strokeWidth={1} />
                      <p className="mt-4 font-bold">{t('tool.imageAnalyzer.resultHint')}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
          <ErrorMessage message={error} onRetry={handleSubmit} />
        </motion.div>
      )}
    </div>
  );
};

export default ImageAnalyzerPage;
