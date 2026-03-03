
// FIX: Import React to resolve the 'Cannot find namespace React' error.
import React from 'react';

export interface CardItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  type: 'skill' | 'tool';
  path: string;
}

export interface Skill extends CardItem {
  type: 'skill';
}

export interface Tool extends CardItem {
  type: 'tool';
}

// FIX: An interface can only extend an object type, but `ContentBlock` is a union type. Removed `extends ContentBlock`.
export interface QuizBlock {
    type: 'quiz';
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

// FIX: An interface can only extend an object type, but `ContentBlock` is a union type. Removed `extends ContentBlock`.
export interface AiChallengeBlock {
    type: 'aiChallenge';
    challenge: string;
    toolId: 'image-analyzer' | 'video-analyzer' | 'image-animator' | 'image-generator';
}

export interface PollBlock {
    type: 'poll';
    question: string;
    options: string[];
}

export interface QAndABlock {
    type: 'qAndA';
    question:string;
    answer: string;
}

export interface ExpertSaysBlock {
    type: 'expertSays';
    quote: string;
    expertName: string;
}

export interface MythBusterBlock {
    type: 'mythBuster';
    myth: string;
    reality: string;
}

export interface DoAndDontBlock {
    type: 'doAndDont';
    dos: string[];
    donts: string[];
}

export interface ShockingFactBlock {
    type: 'shockingFact';
    fact: string;
}

export interface IdeaCornerBlock {
    type: 'ideaCorner';
    prompt: string;
}

export interface FlashcardBlock {
    type: 'flashcard';
    front: string;
    back: string;
}


export type ContentBlock = 
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'template'; text: string }
  | { type: 'benefits'; text: string }
  | { type: 'infographic'; text: string }
  | { type: 'funFact'; text: string }
  | QuizBlock
  | AiChallengeBlock
  | PollBlock
  | QAndABlock
  | ExpertSaysBlock
  | MythBusterBlock
  | DoAndDontBlock
  | ShockingFactBlock
  | IdeaCornerBlock
  | FlashcardBlock;


export interface SubPage {
  title: string;
  imageSuggestion: string;
  content: ContentBlock[];
  motionStoryboard: string;
}

export interface GeneratedContent {
  skillName: string;
  subPages: SubPage[];
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
