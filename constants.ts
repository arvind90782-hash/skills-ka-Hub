
import type { Skill, Tool } from './types';
import { CodeIcon } from './components/icons/CodeIcon';
import { DesignIcon } from './components/icons/DesignIcon';
import { VideoIcon } from './components/icons/VideoIcon';
import { WriteIcon } from './components/icons/WriteIcon';
import { MarketingIcon } from './components/icons/MarketingIcon';
import { AnimationIcon } from './components/icons/AnimationIcon';
import { AnalyzeIcon } from './components/icons/AnalyzeIcon';
import { MovieIcon } from './components/icons/MovieIcon';
import { ChatIcon } from './components/icons/ChatIcon';
import { ImageIcon } from './components/icons/ImageIcon';
import { BoltIcon } from './components/icons/BoltIcon';


export const SKILLS: Skill[] = [
  {
    id: 'graphic-design',
    name: 'Graphic Design',
    description: 'Shaandaar visuals aur illustrations banana seekhein.',
    icon: DesignIcon,
    color: 'from-pink-500 to-rose-500',
    type: 'skill',
    path: '/category/graphic-design',
  },
  {
    id: 'video-editing',
    name: 'Video Editing',
    description: 'Video ke zariye kahani sunane ki kala mein maahir banein.',
    icon: VideoIcon,
    color: 'from-blue-500 to-cyan-500',
    type: 'skill',
    path: '/category/video-editing',
  },
  {
    id: 'content-writing',
    name: 'Content Writing',
    description: 'Zabardast kahaniyan aur asardaar copy likhna seekhein.',
    icon: WriteIcon,
    color: 'from-green-400 to-emerald-500',
    type: 'skill',
    path: '/category/content-writing',
  },
  {
    id: 'programming',
    name: 'Programming',
    description: 'Websites, apps, aur software solutions banana seekhein.',
    icon: CodeIcon,
    color: 'from-indigo-500 to-purple-600',
    type: 'skill',
    path: '/category/programming',
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    description: 'Brands aur audience ko online badhayein.',
    icon: MarketingIcon,
    color: 'from-amber-500 to-orange-500',
    type: 'skill',
    path: '/category/digital-marketing',
  },
  {
    id: 'animation',
    name: 'Animation',
    description: 'Motion graphics se ideas ko zinda karein.',
    icon: AnimationIcon,
    color: 'from-teal-400 to-sky-500',
    type: 'skill',
    path: '/category/animation',
  },
];

export const TOOLS: Tool[] = [
  {
    id: 'qna-bot',
    name: 'AI Dost',
    description: 'Google Search se jude, up-to-date jawabat paayein.',
    icon: ChatIcon,
    color: 'from-cyan-500 to-blue-500',
    type: 'tool',
    path: '/qna-bot',
  },
  {
    id: 'image-generator',
    name: 'Chitra-AI',
    description: 'Apne ideas ko 4K quality tak ki images mein badlein.',
    icon: ImageIcon,
    color: 'from-rose-400 to-red-500',
    type: 'tool',
    path: '/image-generator',
  },
  {
    id: 'rocket-writer',
    name: 'Rocket Writer',
    description: 'Bijli ki tezi se content ideas aur headlines paayein.',
    icon: BoltIcon,
    color: 'from-amber-400 to-orange-500',
    type: 'tool',
    path: '/rocket-writer',
  },
  {
    id: 'image-analyzer',
    name: 'Chitra Reporter',
    description: 'Photo upload karein aur uske baare mein kuch bhi poochein.',
    icon: AnalyzeIcon,
    color: 'from-red-500 to-orange-500',
    type: 'tool',
    path: '/image-analyzer',
  },
  {
    id: 'video-analyzer',
    name: 'Video Ka Jaसूस',
    description: 'Video upload karein aur uske andar ki jaankari nikalein.',
    icon: VideoIcon,
    color: 'from-purple-500 to-indigo-500',
    type: 'tool',
    path: '/video-analyzer',
  },
  {
    id: 'image-animator',
    name: 'Photo Ko Jivdan Do',
    description: 'Ek photo se Veo ki madad se video banayein.',
    icon: MovieIcon,
    color: 'from-green-500 to-teal-500',
    type: 'tool',
    path: '/image-animator',
  },
];
