
import React from 'react';
import { motion } from 'framer-motion';
import { SKILLS, TOOLS } from '../constants';
import Card from '../components/SkillCard';
import { Sparkles, Zap, BookOpen } from 'lucide-react';

const HomePage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="text-center space-y-8 pt-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/20"
        >
          <Sparkles size={16} />
          <span className="text-xs font-bold uppercase tracking-widest">Next-Gen Learning Hub</span>
        </motion.div>
        
        <div className="space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-brand-text"
          >
            Skills Ka <span className="text-brand-accent">Adda</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-brand-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Aapka freelance safar yahan se shuru hota hai. AI tools aur modern skills seekhein, wo bhi ultra-fast tarike se.
          </motion.p>
        </div>
      </section>

      {/* Skills Section */}
      <section className="space-y-10">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-accent">
              <BookOpen size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Learning Paths</span>
            </div>
            <h2 className="text-3xl font-bold text-brand-text tracking-tight">Freelance Skills</h2>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {SKILLS.map((skill) => (
            <Card key={skill.id} item={skill} />
          ))}
        </motion.div>
      </section>

      {/* AI Tools Section */}
      <section className="space-y-10">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-accent">
              <Zap size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">AI Powerups</span>
            </div>
            <h2 className="text-3xl font-bold text-brand-text tracking-tight">Smart AI Tools</h2>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {TOOLS.map((tool) => (
            <Card key={tool.id} item={tool} />
          ))}
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
