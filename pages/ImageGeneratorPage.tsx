
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { generateImage } from '../services/geminiService';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

type ImageSize = '1K' | '2K' | '4K';

const ImageGeneratorPage: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [result, setResult] = useState<{ imageUrl: string; altText: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState(false);
  
  const checkApiKey = useCallback(async () => {
    if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
      setApiKeySelected(true);
    } else {
      setApiKeySelected(false);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true);
    }
  };

  const handleSubmit = async () => {
    if (!prompt) {
      setError('Pehle ek prompt likhein.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const generatedResult = await generateImage(prompt, imageSize);
      setResult(generatedResult);
    } catch (e: any) {
        let errorMessage = e.message || 'Image banate waqt kuch gadbad ho gayi.';
        if (errorMessage.includes("Requested entity was not found")) {
            errorMessage = "Aapki API key kaam nahi kar रही. Please ek doosri key chunein.";
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
            <div className="bg-brand-secondary rounded-2xl shadow-lg p-6 md:p-8">
                <h1 className="text-3xl font-extrabold text-brand-text">API Key Zaroori Hai</h1>
                <p className="text-brand-text-secondary mt-4 mb-6">
                    High-quality image generation ke liye ek paid Google Cloud project ki API key chahiye. Please neeche diye gaye button par click karke apni key chunein.
                </p>
                <button onClick={handleSelectKey} className="w-full px-6 py-3 bg-brand-accent rounded-lg font-semibold hover:bg-brand-accent-light transition-colors">
                    API Key Chunein
                </button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-brand-accent hover:underline mt-4 inline-block">
                    Billing ke baare mein aur jaanein
                </a>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl animate-fadeIn">
      <Link to="/" className="text-brand-accent hover:underline mb-4 inline-block">&larr; Sabhi tools par wapas</Link>
      <div className="bg-brand-secondary rounded-2xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-text">Chitra-AI</h1>
          <p className="text-brand-text-secondary mt-2">Apne shabdon se shaandaar tasveerein banayein.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">Aapko Kaisi Image Chahiye?</label>
            <textarea
              id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Jaise: A futuristic city in India with flying cars, in a detailed, photorealistic style"
              className="w-full bg-brand-primary border border-brand-secondary rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent outline-none transition"
              rows={4}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">Image Quality</label>
            <div className="flex gap-4">
                {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
                    <button key={size} onClick={() => setImageSize(size)} className={`w-full p-3 rounded-lg font-semibold transition-colors ${imageSize === size ? 'bg-brand-accent text-white' : 'bg-brand-primary'}`}>{size}</button>
                ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading || !prompt}
            className="w-full px-6 py-3 bg-brand-accent rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent-light transition-colors">
            {loading ? 'Image ban rahi hai...' : 'Generate Karein'}
          </button>
        </div>
      </div>
      
      {loading && <Loading message="AI aapke liye ek masterpiece bana raha hai..." />}
      {error && <ErrorMessage message={error} onRetry={handleSubmit} />}
      {result && (
        <div className="mt-6 bg-brand-secondary rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-brand-text mb-4">Aapki AI Image</h2>
          <img src={result.imageUrl} alt={result.altText} className="w-full rounded-lg" />
          <p className="text-sm text-brand-text-secondary italic mt-2">{result.altText}</p>
        </div>
      )}
    </div>
  );
};

export default ImageGeneratorPage;
