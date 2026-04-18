import React, { Suspense, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from './hooks/useTheme';
import { LocaleProvider, useLocale } from './hooks/useLocale';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Header from './components/Header';
import CinematicIntro from './components/CinematicIntro';
import Loading from './components/Loading';
import AuthGate from './components/AuthGate';
import { TOOLS } from './constants';
import { logUsageEvent } from './services/analyticsService';

const HomePage = React.lazy(() => import('./pages/HomePage'));
const ToolsPage = React.lazy(() => import('./pages/ToolsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const CategoryPage = React.lazy(() => import('./pages/CategoryPage'));
const ImageAnalyzerPage = React.lazy(() => import('./pages/ImageAnalyzerPage'));
const VideoAnalyzerPage = React.lazy(() => import('./pages/VideoAnalyzerPage'));
const ImageAnimatorPage = React.lazy(() => import('./pages/ImageAnimatorPage'));
const QnABotPage = React.lazy(() => import('./pages/QnABotPage'));
const ImageGeneratorPage = React.lazy(() => import('./pages/ImageGeneratorPage'));
const RocketWriterPage = React.lazy(() => import('./pages/RocketWriterPage'));
const UniversalDownloaderPage = React.lazy(() => import('./pages/UniversalDownloaderPage'));
const ProToolsPage = React.lazy(() => import('./pages/ProToolsPage'));
const AdminPanelPage = React.lazy(() => import('./pages/AdminPanelPage'));
const SecretCreatorLabPage = React.lazy(() => import('./pages/SecretCreatorLabPage'));
const SmartLinkHubPage = React.lazy(() => import('./pages/SmartLinkHubPage'));
const UltraToolsPage = React.lazy(() => import('./pages/UltraToolsPage'));
const CreatorProfilePage = React.lazy(() => import('./pages/CreatorProfilePage'));
const UserProfilePage = React.lazy(() => import('./pages/UserProfilePage'));

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
        <Suspense fallback={<Loading message="Loading page..." />}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<CreatorProfilePage />} />
            <Route path="/my-profile" element={<UserProfilePage />} />
            <Route path="/creator-profile" element={<Navigate to="/about" replace />} />
            <Route path="/user-profile" element={<Navigate to="/my-profile" replace />} />
            <Route path="/ultra-tools" element={<UltraToolsPage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/image-analyzer" element={<ImageAnalyzerPage />} />
            <Route path="/video-analyzer" element={<VideoAnalyzerPage />} />
            <Route path="/image-animator" element={<ImageAnimatorPage />} />
            <Route path="/qna-bot" element={<QnABotPage />} />
            <Route path="/image-generator" element={<ImageGeneratorPage />} />
            <Route path="/rocket-writer" element={<RocketWriterPage />} />
            <Route path="/media-downloader" element={<UniversalDownloaderPage />} />
            <Route path="/tools/:toolId" element={<ProToolsPage />} />
            <Route path="/secret-creator-lab" element={<SecretCreatorLabPage />} />
            <Route path="/smart-link-hub" element={<SmartLinkHubPage />} />
            <Route path="/admin" element={<AdminPanelPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
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

      <footer className="px-4 pb-8 pt-2 text-center text-sm text-brand-text-secondary">
        &copy; 2026 Skills Hub | <span className="font-semibold text-brand-text">{watermarkText}</span>
      </footer>

      <CinematicIntro isOpen={showIntro} onClose={() => setShowIntro(false)} />
    </div>
  );
};

const AppBody: React.FC = () => {
  const { loading, isAuthenticated, authReady } = useAuth();
  const { t } = useLocale();

  if (loading) {
    return <Loading message={t('auth.wait')} />;
  }

  if (!authReady) {
    return <AppLayout />;
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
