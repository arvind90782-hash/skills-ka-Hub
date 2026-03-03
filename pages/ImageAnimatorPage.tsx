
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { animateImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileToBase64';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const ImageAnimatorPage: React.FC = () => {
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
        // Assume key selection is successful and proceed
        setApiKeySelected(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setVideoUrl('');
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !prompt) {
      setError('Pehle ek photo upload karein aur prompt likhein.');
      return;
    }
    setLoading(true);
    setError(null);
    setVideoUrl('');

    try {
      const imageBase64 = await fileToBase64(imageFile);
      const generatedVideoUrl = await animateImage(
        prompt, 
        imageBase64, 
        imageFile.type, 
        aspectRatio,
        setLoadingMessage
      );
      setVideoUrl(generatedVideoUrl);
    } catch (e: any) {
        let errorMessage = e.message || 'Video banate waqt kuch gadbad ho gayi.';
        if (errorMessage.includes("Requested entity was not found")) {
            errorMessage = "Aapki API key kaam nahi kar rahi. Please ek doosri key chunein.";
            setApiKeySelected(false); // Reset key state to show the button again
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
            <div className="bg-brand-secondary rounded-2xl shadow-lg p-6 md:p-8">
                <h1 className="text-3xl font-extrabold text-brand-text">API Key Zaroori Hai</h1>
                <p className="text-brand-text-secondary mt-4 mb-6">
                    Veo video generation ke liye ek paid Google Cloud project ki API key chahiye. Please neeche diye gaye button par click karke apni key chunein.
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
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-text">Photo Ko Jivdan Do</h1>
          <p className="text-brand-text-secondary mt-2">Apni photo ko Veo AI ki madad se video mein badlein.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="image-upload" className="block text-sm font-medium text-brand-text-secondary mb-2">Shuruaati Photo</label>
            <input 
              id="image-upload" type="file" accept="image/*" onChange={handleFileChange} 
              className="block w-full text-sm text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent file:text-white hover:file:bg-brand-accent-light"
            />
          </div>

          {imagePreview && <img src={imagePreview} alt="Preview" className="rounded-lg max-h-64 mx-auto object-contain" />}

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">Animation Kaisa Ho? (Prompt)</label>
            <textarea
              id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder="Jaise: Ek astronaut chaand par dance kar raha hai"
              className="w-full bg-brand-primary border border-brand-secondary rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent outline-none transition"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">Video Ka Size (Aspect Ratio)</label>
            <div className="flex gap-4">
                <button onClick={() => setAspectRatio('16:9')} className={`w-full p-3 rounded-lg font-semibold transition-colors ${aspectRatio === '16:9' ? 'bg-brand-accent text-white' : 'bg-brand-primary'}`}>Landscape (16:9)</button>
                <button onClick={() => setAspectRatio('9:16')} className={`w-full p-3 rounded-lg font-semibold transition-colors ${aspectRatio === '9:16' ? 'bg-brand-accent text-white' : 'bg-brand-primary'}`}>Portrait (9:16)</button>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading || !imageFile || !prompt}
            className="w-full px-6 py-3 bg-brand-accent rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent-light transition-colors">
            {loading ? 'Video ban rahi hai...' : 'Animate Karein'}
          </button>
        </div>
      </div>
      
      {loading && <Loading message={loadingMessage || "AI jaadugar apna kaam kar raha hai..."} />}
      {error && <ErrorMessage message={error} onRetry={handleSubmit} />}
      {videoUrl && (
        <div className="mt-6 bg-brand-secondary rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-brand-text mb-4">Aapki Animated Video</h2>
          <video src={videoUrl} controls autoPlay loop className="w-full rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default ImageAnimatorPage;
