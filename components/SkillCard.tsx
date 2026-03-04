
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { CardItem } from '../types';
import { useLocale } from '../hooks/useLocale';

interface CardProps {
  item: CardItem;
}

const Card: React.FC<CardProps> = ({ item }) => {
  const Icon = item.icon;
  const { t } = useLocale();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="h-full"
    >
      <Link 
        to={item.path} 
        className="group relative flex flex-col h-full p-8 ios-card overflow-hidden transition-all duration-500 hover:border-brand-accent/30"
      >
        {/* Background Glow */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br ${item.color} opacity-10 group-hover:opacity-20 transition-opacity duration-500 blur-3xl`} />
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.1 }}
              className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} shadow-xl shadow-brand-accent/20`}
            >
              <Icon className="h-8 w-8 text-white" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileHover={{ opacity: 1, x: 0 }}
              className="text-brand-accent"
            >
              <ArrowRight size={24} />
            </motion.div>
          </div>

          <div className="mt-auto">
            <h3 className="text-2xl font-bold text-brand-text mb-2 tracking-tight">{item.name}</h3>
            <p className="text-brand-text-secondary leading-relaxed line-clamp-2">{item.description}</p>
          </div>
          
          <div className="mt-6 flex items-center gap-2">
            <div className="h-1 w-12 rounded-full bg-brand-accent/20 overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                whileHover={{ x: '0%' }}
                className="h-full w-full bg-brand-accent"
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {t('card.start')}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default Card;
