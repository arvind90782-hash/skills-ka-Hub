
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './hooks/useTheme';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import Header from './components/Header';
import ImageAnalyzerPage from './pages/ImageAnalyzerPage';
import VideoAnalyzerPage from './pages/VideoAnalyzerPage';
import ImageAnimatorPage from './pages/ImageAnimatorPage';
import QnABotPage from './pages/QnABotPage';
import ImageGeneratorPage from './pages/ImageGeneratorPage';
import RocketWriterPage from './pages/RocketWriterPage';
import CinematicIntro from './components/CinematicIntro';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div 
        key={location.pathname}
        initial={{ opacity: 0, x: 30, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -30, scale: 1.02 }}
        transition={{ 
          type: 'spring', 
          damping: 25, 
          stiffness: 200,
          mass: 0.8
        }}
        className="w-full"
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/image-analyzer" element={<ImageAnalyzerPage />} />
          <Route path="/video-analyzer" element={<VideoAnalyzerPage />} />
          <Route path="/image-animator" element={<ImageAnimatorPage />} />
          <Route path="/qna-bot" element={<QnABotPage />} />
          <Route path="/image-generator" element={<ImageGeneratorPage />} />
          <Route path="/rocket-writer" element={<RocketWriterPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(false);

  // Preload video on mount
  useEffect(() => {
    const video = document.createElement('video');
    video.src = "https://cdn.pixabay.com/video/2020/03/24/34015-399677271_large.mp4"; // Reliable Pixabay source
    video.preload = "auto";
  }, []);

  return (
    <ThemeProvider>
      <HashRouter>
        <div className="min-h-screen bg-brand-primary font-sans text-brand-text transition-colors duration-700 selection:bg-brand-accent/30">
          <Header onLogoClick={() => setShowIntro(true)} />
          <main className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden">
            <AnimatedRoutes />
          </main>
          
          <CinematicIntro 
            isOpen={showIntro} 
            onClose={() => setShowIntro(false)} 
          />
        </div>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;
<footer style={{
  textAlign: "center",
  padding: "20px",
  fontSize: "14px",
  color: "#888"
}}>
  © 2026 Skills Ka Hub • Made by <b>Editor Nishant</b>
</footer>