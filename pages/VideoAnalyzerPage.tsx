
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyzeVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileToBase64';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const VideoAnalyzerPage: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Is video ka summary batao.');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setResult('');
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!videoFile || !prompt) {
      setError('Pehle ek video upload karein aur sawal likhein.');
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
      setError(e.message || 'Analysis karte waqt kuch gadbad ho gayi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl animate-fadeIn">
      <Link to="/" className="text-brand-accent hover:underline mb-4 inline-block">&larr; Sabhi tools par wapas</Link>
      <div className="bg-brand-secondary rounded-2xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-text">Video Ka Jaसूस</h1>
          <p className="text-brand-text-secondary mt-2">Video upload karein aur uske gehre raaz paayein.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="video-upload" className="block text-sm font-medium text-brand-text-secondary mb-2">Video Upload Karein</label>
            <input 
              id="video-upload"
              type="file" 
              accept="video/*"
              onChange={handleFileChange} 
              className="block w-full text-sm text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent file:text-white hover:file:bg-brand-accent-light"
            />
          </div>

          {videoPreview && (
            <div className="flex justify-center bg-brand-primary rounded-lg">
              <video src={videoPreview} controls className="rounded-lg max-h-72" />
            </div>
          )}

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-brand-text-secondary mb-2">Aapka Sawal</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Jaise: Is video mein main points kya hain?"
              className="w-full bg-brand-primary border border-brand-secondary rounded-lg p-3 text-brand-text focus:ring-2 focus:ring-brand-accent outline-none transition"
              rows={3}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !videoFile}
            className="w-full px-6 py-3 bg-brand-accent rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-accent-light transition-colors"
          >
            {loading ? 'Analysis ho raha hai...' : 'Analyze Karein'}
          </button>
        </div>
      </div>
      
      {loading && <Loading message="AI aapke video ko frame by frame dekh raha hai..." />}
      {error && <ErrorMessage message={error} onRetry={handleSubmit} />}
      {result && (
        <div className="mt-6 bg-brand-secondary rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-brand-text mb-4">Analysis Ka Natija</h2>
          <p className="text-brand-text-secondary whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyzerPage;
