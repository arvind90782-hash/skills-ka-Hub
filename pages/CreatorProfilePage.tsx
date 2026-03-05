import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Instagram, 
  Mail, 
  Globe, 
  Video, 
  Code, 
  Palette, 
  Sparkles,
  Zap,
  Target,
  MessageCircle,
  ExternalLink,
  Award,
  TrendingUp,
  Users
} from 'lucide-react';

const CreatorProfilePage: React.FC = () => {
  const creatorInfo = {
    name: 'Nishant Singh',
    role: 'Video Editor + Website Developer + Creative Designer',
    about: 'Main ek creative student aur digital creator hoon jise technology aur creativity ka combination bohot pasand hai. Mujhe video editing ka bohot shauk hai aur maine khud editing tools explore karke kaafi creative cheezein seekhi hain.',
    story: 'Maine ye website isliye banayi hai taaki log boring courses ki jagah fun aur interactive tarike se skills seekh sake. Goal hai logon ko fast aur smart tarike se digital skills sikhana.',
    skills: [
      'Video Editing',
      'Thumbnail Designing', 
      'Graphic Design',
      'Website Development',
      'AI Tools Building',
      'Content Creation'
    ],
    contact: {
      email: 'arvind90782@gmail.com',
      instagram: 'editor.nishant',
      website: 'https://skillskahub.vercel.app'
    },
    imageUrl: 'https://drive.google.com/uc?export=download&id=1e_jpmmyBMp9GT7aKE3_mFVQ5amBxhCZ-'
  };

  const stats = [
    { icon: <Video size={20} />, label: 'Videos Edited', value: '500+' },
    { icon: <Code size={20} />, label: 'Websites Built', value: '50+' },
    { icon: <Palette size={20} />, label: 'Thumbnails', value: '1000+' },
    { icon: <Users size={20} />, label: 'Students Helped', value: '10K+' }
  ];

  const services = [
    { icon: <Video size={24} />, title: 'Video Editor', description: 'Professional video editing for YouTube, Instagram, and more' },
    { icon: <Code size={24} />, title: 'Website Developer', description: 'Modern, fast, and beautiful websites' },
    { icon: <Palette size={24} />, title: 'Creative Designer', description: 'Thumbnails, graphics, and visual content' }
  ];

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-brand-text-secondary transition-colors hover:text-brand-accent">
        <div className="rounded-full p-2 ios-glass transition-all group-hover:bg-brand-accent group-hover:text-white">
          <ArrowLeft size={20} />
        </div>
        <span className="font-semibold">Back to Home</span>
      </Link>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ios-card overflow-hidden"
      >
        <div className="relative bg-gradient-to-br from-brand-accent/20 via-brand-primary to-cyan-500/10 p-8 md:p-12">
          {/* Floating elements */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -right-4 -top-4 rounded-full bg-brand-accent/20 p-4"
          >
            <Sparkles className="text-brand-accent" size={24} />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -left-2 top-1/3 rounded-full bg-cyan-500/20 p-3"
          >
            <Zap className="text-cyan-400" size={20} />
          </motion.div>

          <div className="flex flex-col items-center gap-6 md:flex-row">
            {/* Profile Image - Circle Frame */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative flex-shrink-0"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-accent to-cyan-400 blur-xl opacity-50"></div>
              <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-brand-accent/30 shadow-2xl">
                <img 
                  src={creatorInfo.imageUrl} 
                  alt={creatorInfo.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/300x300?text=Nishant';
                  }}
                />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -bottom-2 -right-2 rounded-full bg-brand-accent p-2"
              >
                <Award className="text-white" size={20} />
              </motion.div>
            </motion.div>

            {/* Creator Info */}
            <div className="text-center md:text-left">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center gap-2 rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-brand-accent"
              >
                <Sparkles size={14} />
                Creator / Developer
              </motion.p>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 text-4xl font-black tracking-tight text-brand-text md:text-5xl"
              >
                {creatorInfo.name}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-2 text-lg font-semibold text-brand-accent"
              >
                {creatorInfo.role}
              </motion.p>

              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 max-w-xl text-brand-text-secondary"
              >
                {creatorInfo.about}
              </motion.p>

              {/* Social Links */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start"
              >
                <a 
                  href={`mailto:${creatorInfo.contact.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-2 text-sm font-semibold text-brand-text transition-all hover:border-brand-accent/40 hover:bg-brand-accent/10"
                >
                  <Mail size={16} />
                  Email
                </a>
                <a 
                  href={`https://instagram.com/${creatorInfo.contact.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-2 text-sm font-semibold text-brand-text transition-all hover:border-pink-500/40 hover:bg-pink-500/10"
                >
                  <Instagram size={16} />
                  Instagram
                </a>
                <a 
                  href={creatorInfo.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-2 text-sm font-semibold text-brand-text transition-all hover:border-brand-accent/40 hover:bg-brand-accent/10"
                >
                  <Globe size={16} />
                  Website
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {stats.map((stat, idx) => (
          <div key={idx} className="ios-card p-4 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
              {stat.icon}
            </div>
            <p className="text-2xl font-black text-brand-text">{stat.value}</p>
            <p className="text-xs font-semibold text-brand-text-secondary">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Story Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="ios-card mt-6 border border-brand-accent/20 p-6 md:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent/10">
            <Target className="text-brand-accent" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-text">My Story</h2>
            <p className="text-sm text-brand-text-secondary">Why I built this platform</p>
          </div>
        </div>
        <p className="mt-4 text-brand-text-secondary leading-relaxed">
          {creatorInfo.story}
        </p>
      </motion.div>

      {/* Skills Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="ios-card mt-6 border border-brand-accent/20 p-6 md:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent/10">
            <Zap className="text-brand-accent" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-text">Skills</h2>
            <p className="text-sm text-brand-text-secondary">What I bring to the table</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {creatorInfo.skills.map((skill, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              className="rounded-full border border-brand-accent/30 bg-brand-accent/5 px-4 py-2 text-sm font-semibold text-brand-text"
            >
              {skill}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Services / Hiring Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="ios-card mt-6 border border-brand-accent/20 p-6 md:p-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent/10">
            <TrendingUp className="text-brand-accent" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-text">Services</h2>
            <p className="text-sm text-brand-text-secondary">Need help? Let's connect!</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + idx * 0.1 }}
              className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
                {service.icon}
              </div>
              <h3 className="font-bold text-brand-text">{service.title}</h3>
              <p className="mt-1 text-sm text-brand-text-secondary">{service.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4"
        >
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div>
              <h3 className="font-bold text-emerald-300">Need a Video Editor or Website Developer?</h3>
              <p className="text-sm text-brand-text-secondary">Contact me for professional work!</p>
            </div>
            <a 
              href={`mailto:${creatorInfo.contact.email}?subject=Project Inquiry`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-6 py-3 font-bold text-white transition-all hover:bg-brand-accent/80"
            >
              <MessageCircle size={18} />
              Contact Me
              <ExternalLink size={16} />
            </a>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer Quote */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mt-8 text-center"
      >
        <p className="text-lg font-medium text-brand-text-secondary">
          "Creative learning • Fast growth • Real results"
        </p>
        <p className="mt-2 text-sm text-brand-text-secondary">
          © 2026 {creatorInfo.name} • Skills Ka Hub
        </p>
      </motion.div>
    </div>
  );
};

export default CreatorProfilePage;

