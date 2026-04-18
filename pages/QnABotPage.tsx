import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Bot, User, Search, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { askQna, getFriendlyAiErrorMessage } from '../services/geminiService';
import { useLocale } from '../hooks/useLocale';
import { logUsageEvent } from '../services/analyticsService';

interface GroundingSource {
  uri: string;
  title: string;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  sources?: GroundingSource[];
}

const safeHostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'source';
  }
};

const QnABotPage: React.FC = () => {
  const { languageName, t } = useLocale();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ sender: 'bot', text: t('tool.qna.welcome') }]);
    setError(null);
  }, [t]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) {
      return;
    }

    const currentInput = userInput.trim();
    const historyForModel = messages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      text: m.text,
    }));

    setUserInput('');
    setIsLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { sender: 'user', text: currentInput }, { sender: 'bot', text: '' }]);

    try {
      void logUsageEvent('tool_action', { toolId: 'qna-bot', action: 'send_message' });
      const result = await askQna(currentInput, historyForModel, languageName);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          sender: 'bot',
          text: result.text || t('tool.qna.replyError'),
          sources: result.sources,
        };
        return next;
      });
    } catch (err: unknown) {
      const friendly = getFriendlyAiErrorMessage(err, t('tool.qna.replyError'));
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { sender: 'bot', text: friendly };
        return next;
      });
      setError(friendly);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-120px)] max-w-4xl flex-col">
      <Link
        to="/"
        className="group mb-6 inline-flex items-center gap-2 text-brand-text-secondary transition-colors hover:text-brand-accent"
      >
        <div className="rounded-full p-2 ios-glass transition-all group-hover:bg-brand-accent group-hover:text-white">
          <ArrowLeft size={18} />
        </div>
        <span className="font-semibold">{t('common.backTools')}</span>
      </Link>

      <div className="relative flex flex-grow flex-col overflow-hidden ios-card">
        <div className="z-10 border-b border-brand-text-secondary/10 p-6 ios-glass">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent shadow-inner">
              <Bot size={28} />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-brand-text">
                {t('tool.qna.title')}
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <Sparkles size={18} className="text-amber-400" />
                </motion.div>
              </h1>
              <p className="flex items-center gap-1 text-sm font-medium text-brand-text-secondary">
                <Search size={12} /> {t('tool.qna.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 p-4 text-center text-sm font-bold text-red-500"
          >
            {error}
          </motion.div>
        )}

        <div ref={chatContainerRef} className="custom-scrollbar flex-grow space-y-6 overflow-y-auto p-6">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${
                    msg.sender === 'user' ? 'bg-brand-accent text-white' : 'bg-brand-primary text-brand-accent'
                  }`}
                >
                  {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>

                <div className={`max-w-[80%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-5 py-3 shadow-sm ${
                      msg.sender === 'user'
                        ? 'rounded-tr-none bg-brand-accent text-white'
                        : 'rounded-tl-none border-brand-accent/10 text-brand-text ios-glass'
                    }`}
                  >
                    {msg.text === '' && isLoading ? (
                      <div className="flex gap-1 py-2">
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6 }}
                          className="h-1.5 w-1.5 rounded-full bg-brand-accent"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          className="h-1.5 w-1.5 rounded-full bg-brand-accent"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                          className="h-1.5 w-1.5 rounded-full bg-brand-accent"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2 leading-relaxed">
                        {msg.text.split('\n').map((line, i) => (
                          <p key={i} className={line.trim() === '' ? 'h-2' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 pt-1">
                      {msg.sources.map((source, i) => (
                        <a
                          key={i}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider text-brand-accent transition-all hover:bg-brand-accent hover:text-white ios-glass"
                        >
                          <ExternalLink size={10} />
                          {safeHostname(source.uri)}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="border-t border-brand-text-secondary/10 p-6 ios-glass">
          <form onSubmit={handleSendMessage} className="relative flex items-center gap-3">
            <div className="relative flex-grow">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={t('tool.qna.input')}
                className="w-full rounded-2xl border-2 border-transparent bg-brand-primary/50 py-4 pl-6 pr-14 text-brand-text shadow-inner outline-none transition-all duration-300 placeholder:text-brand-text-secondary/50 focus:border-brand-accent/30"
                disabled={isLoading}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-accent/30">
                <Sparkles size={20} />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="rounded-2xl bg-brand-accent p-4 text-white shadow-lg shadow-brand-accent/30 transition-all disabled:grayscale disabled:opacity-30"
            >
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
            </motion.button>
          </form>
          <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-brand-text-secondary opacity-50">
            {t('tool.qna.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default QnABotPage;
