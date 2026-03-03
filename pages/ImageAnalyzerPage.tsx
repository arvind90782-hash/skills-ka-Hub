
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ArrowLeft, Upload, Sparkles, Wand2, Search, Loader2, Image as ImageIcon } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileToBase64';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const ImageAnalyzerPage: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Is photo mein kya-kya hai? विस्तार से बताओ।');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setResult('');
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !prompt) {
      setError('Pehle ek photo upload karein aur sawal likhein.');
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
      setError(e.message || 'Analysis karte waqt kuch gadbad ho gayi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <Link to="/" className="inline-flex items-center gap-2 text-brand-text-secondary hover:text-brand-accent mb-8 transition-colors group">
        <div className="p-2 rounded-full ios-glass group-hover:bg-brand-accent group-hover:text-white transition-all">
          <ArrowLeft size={20} />
        </div>
        <span className="font-semibold">Sabhi Tools</span>
      </Link>

      <div className="ios-card overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-[10px] font-black uppercase tracking-widest">
                    <Camera size={12} /> Visual Intelligence
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-brand-text tracking-tighter leading-none">
                    Chitra Reporter
                </h1>
                <p className="text-brand-text-secondary text-lg font-medium">
                    Photo upload karein aur AI se uske raaz jaanein.
                </p>
            </div>
            <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-3xl bg-brand-accent/10 flex items-center justify-center text-brand-accent shadow-inner">
                    <ImageIcon size={40} />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-brand-text-secondary opacity-50">
                        Step 1: Photo Chunein
                    </label>
                    <div className="relative group">
                        <input 
                            id="image-upload"
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange} 
                            className="hidden"
                        />
                        <label 
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full aspect-square rounded-[var(--radius-ios-lg)] border-4 border-dashed border-brand-accent/20 bg-brand-primary/30 hover:bg-brand-accent/5 hover:border-brand-accent/40 transition-all cursor-pointer group overflow-hidden"
                        >
                            {imagePreview ? (
                                <motion.img 
                                    initial={{ scale: 1.1, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-brand-text-secondary group-hover:text-brand-accent transition-colors">
                                    <div className="p-6 rounded-full ios-glass">
                                        <Upload size={32} />
                                    </div>
                                    <span className="font-bold">Upload Photo</span>
                                </div>
                            )}
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-brand-text-secondary opacity-50">
                        Step 2: Aapka Sawal
                    </label>
                    <div className="relative">
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Jaise: Is design ko aur behtar kaise banayein?"
                            className="w-full bg-brand-primary/50 border-2 border-transparent focus:border-brand-accent/30 rounded-2xl p-6 text-brand-text placeholder:text-brand-text-secondary/50 outline-none transition-all duration-300 shadow-inner min-h-[120px]"
                        />
                        <div className="absolute right-4 bottom-4 text-brand-accent/20">
                            <Sparkles size={24} />
                        </div>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={loading || !imageFile}
                    className="w-full py-5 bg-brand-accent text-white rounded-2xl font-black text-lg shadow-xl shadow-brand-accent/30 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            Analysis ho raha hai...
                        </>
                    ) : (
                        <>
                            <Wand2 size={24} />
                            Analyze Karein
                        </>
                    )}
                </motion.button>
            </div>

            <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-brand-text-secondary opacity-50">
                    Result: AI Ka Natija
                </label>
                <div className="ios-glass rounded-[var(--radius-ios-lg)] min-h-[400px] p-8 relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-6"
                            >
                                <div className="relative">
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                        className="w-24 h-24 rounded-full border-4 border-brand-accent/20 border-t-brand-accent"
                                    />
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute inset-0 flex items-center justify-center text-brand-accent"
                                    >
                                        <Search size={32} />
                                    </motion.div>
                                </div>
                                <p className="text-xl font-bold text-brand-text tracking-tight">AI aapki photo ko samajh raha hai...</p>
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
                                    <span className="font-black uppercase tracking-widest text-xs">AI Insight</span>
                                </div>
                                <p className="text-lg text-brand-text leading-relaxed whitespace-pre-wrap">
                                    {result}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 text-brand-text-secondary/30"
                            >
                                <ImageIcon size={64} strokeWidth={1} />
                                <p className="mt-4 font-bold">Result yahan dikhega</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
        >
            <ErrorMessage message={error} onRetry={handleSubmit} />
        </motion.div>
      )}
    </div>
  );
};

export default ImageAnalyzerPage;
