import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './hooks/useTheme';
import { LocaleProvider } from './hooks/useLocale';
import { AuthProvider, useAuth } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import Header from './components/Header';
import ImageAnalyzerPage from './pages/ImageAnalyzerPage';
import VideoAnalyzerPage from './pages/VideoAnalyzerPage';
import ImageAnimatorPage from './pages/ImageAnimatorPage';
import QnABotPage from './pages/QnABotPage';
import ImageGeneratorPage from './pages/ImageGeneratorPage';
import RocketWriterPage from './pages/RocketWriterPage';
import UniversalDownloaderPage from './pages/UniversalDownloaderPage';
import AdminPanelPage from './pages/AdminPanelPage';
import CinematicIntro from './components/CinematicIntro';
import Loading from './components/Loading';
import AuthGate from './components/AuthGate';
import { TOOLS } from './constants';
import { logUsageEvent } from './services/analyticsService';
import { useLocale } from './hooks/useLocale';

const TOOL_PATH_MAP = new Map(TOOLS.map((tool) => [tool.path, tool.id]));

const RouteActivityTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    void logUsageEvent('route_view', { path });

    const toolId = TOOL_PATH_MAP.get(path);
    if (toolId) {
      void logUsageEvent('tool_open', { toolId, path });
    }

    if (path.startsWith('/category/')) {
      const categoryId = path.split('/category/')[1] || 'unknown';
      void logUsageEvent('tool_open', { toolId: `course-${categoryId}`, path });
    }
  }, [location.pathname]);

  return null;
};

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
          mass: 0.8,
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
          <Route path="/media-downloader" element={<UniversalDownloaderPage />} />
          <Route path="/admin" element={<AdminPanelPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const AppLayout: React.FC = () => {
  const [showIntro, setShowIntro] = useState(false);
  const { t } = useLocale();
  const watermarkText = t('footer.text');

  useEffect(() => {
    const video = document.createElement('video');
    video.src = 'https://cdn.pixabay.com/video/2020/03/24/34015-399677271_large.mp4';
    video.preload = 'auto';
  }, []);

  return (
    <div className="min-h-screen bg-brand-primary font-sans text-brand-text transition-colors duration-700 selection:bg-brand-accent/30">
      <Header onLogoClick={() => setShowIntro(true)} />

      <RouteActivityTracker />

      <main className="mx-auto max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
        <AnimatedRoutes />
      </main>

      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-md border border-brand-border/50 bg-brand-secondary/60 px-3 py-1 text-xs font-medium tracking-wide text-brand-text/70 shadow-sm backdrop-blur-sm"
        aria-hidden="true"
      >
        {watermarkText}
      </div>

      <footer style={{ textAlign: 'center', padding: '20px', fontSize: '14px', color: '#888' }}>
        &copy; 2026 Skills Ka Hub • <b>{watermarkText}</b>
      </footer>

      <CinematicIntro isOpen={showIntro} onClose={() => setShowIntro(false)} />
    </div>
  );
};

const AppBody: React.FC = () => {
  const { loading, isAuthenticated } = useAuth();
  const { t } = useLocale();

  if (loading) {
    return <Loading message={t('auth.wait')} />;
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return <AppLayout />;
};

const App: React.FC = () => (
  <ThemeProvider>
    <LocaleProvider>
      <AuthProvider>
        <HashRouter>
          <AppBody />
        </HashRouter>
      </AuthProvider>
    </LocaleProvider>
  </ThemeProvider>
);

export default App;
