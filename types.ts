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

export interface QuizBlock {
    type: 'quiz';
    question: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

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

import type { ToolCategory, ToolGenerationType, ToolProvider } from '../services/toolCatalog';

export type QuotaInfo = {
  quotaMetric?: string;
  quotaId?: string;
  quotaValue?: number;
  quotaDimensions?: Record<string, unknown>;
  retryDelay?: string;
  retryDelayMs?: number;
};

export interface ToolResponseMeta {
  toolId: string;
  toolName: string;
  generationType: ToolGenerationType;
  category: ToolCategory;
  requiredApi: string;
  requiredAiEngine: string;
  provider: ToolProvider;
  model: string;
  providerChain: ToolProvider[];
  fallbackUsed: boolean;
  creditsRequired: number;
  estimatedCostUsd: number;
  notice?: string;
  cached?: boolean;
  quotaInfo?: QuotaInfo;
  usageTokens?: { input: number; output: number };
}

export interface SmartLinkOutput {
  title: string;
  url: string;
  content_type: string;
  intent_category: string;
  difficulty_level: string;
  primary_topic: string;
  tags: string[];
  short_summary: string;
  detailed_summary: string[];
  key_insights: string[];
  tools_mentioned: string[];
  methods_frameworks: string[];
  action_steps: string[];
  utility_score: number;
  learning_value_score: number;
  actionability_score: number;
  related_topics: string[];
  knowledge_cluster: string;
  duplicate_status: string;
  recommendation: string;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

