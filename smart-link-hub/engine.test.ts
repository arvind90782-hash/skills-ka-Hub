import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  answerSmartLinkQuestion,
  buildLearningPath,
  buildSmartLinkAnalytics,
  buildSmartLinkReminders,
  buildTopicClusters,
  createSmartLinkDraft,
  detectDuplicateMatch,
  enrichSmartLinkItem,
  mergeSmartLinkRecords,
  normalizeUrl,
  parseUrlsFromText,
  searchSmartLinks,
} from './engine';
import type { SmartLinkItem } from './types';

const makeSignals = (overrides: Partial<Parameters<typeof enrichSmartLinkItem>[1]> = {}) => ({
  pageTitle: 'Transitions for better retention',
  description: 'A practical breakdown of cuts, pacing, transitions, and color grading.',
  visibleText: 'Transitions cuts pacing color grading audio editing.',
  siteName: 'YouTube',
  author: 'Creator Channel',
  canonicalUrl: 'https://www.youtube.com/watch?v=abc123',
  ogType: 'video',
  publishedAt: '2026-04-01T12:00:00.000Z',
  ...overrides,
});

const makeItem = (
  url: string,
  overrides: {
    title?: string;
    description?: string;
    visibleText?: string;
    note?: string;
    reason?: string;
    siteName?: string;
    author?: string;
    customTag?: string;
  } = {},
  existingItems: SmartLinkItem[] = []
): SmartLinkItem => {
  const draft = createSmartLinkDraft(
    {
      urlsText: url,
      note: overrides.note,
      reason: overrides.reason,
      customTag: overrides.customTag,
      source: 'manual',
      priority: 'medium',
    },
    existingItems
  );

  return enrichSmartLinkItem(
    draft,
    makeSignals({
      pageTitle: overrides.title ?? draft.title,
      description: overrides.description ?? draft.summary,
      visibleText: overrides.visibleText ?? `${overrides.title ?? draft.title} ${overrides.description ?? draft.summary}`,
      siteName: overrides.siteName ?? 'YouTube',
      author: overrides.author ?? 'Creator Channel',
      canonicalUrl: url,
    }),
    existingItems
  );
};

describe('Smart Link Hub engine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-18T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses multiple URLs and normalizes known patterns', () => {
    const urls = parseUrlsFromText('Watch https://youtu.be/abc123 and also https://example.com/post?utm_source=feed');
    expect(urls).toHaveLength(2);
    expect(normalizeUrl('https://youtu.be/abc123')).toBe('https://www.youtube.com/watch?v=abc123');
    expect(urls).toContain('https://www.youtube.com/watch?v=abc123');
  });

  it('flags exact duplicate saves', () => {
    const first = makeItem('https://example.com/video-editing/transitions');
    const secondDraft = createSmartLinkDraft({ urlsText: 'https://example.com/video-editing/transitions', source: 'manual' }, [first]);
    const duplicate = detectDuplicateMatch(secondDraft, [first]);

    expect(duplicate?.exact).toBe(true);
    expect(duplicate?.score).toBe(1);
    expect(secondDraft.duplicateDecision).toBe('pending');
    expect(secondDraft.duplicateSimilarityScore).toBe(1);
  });

  it('finds semantic matches through search', () => {
    const transitions = makeItem('https://youtube.com/watch?v=transitions', {
      title: 'Video Editing Transitions for Beginners',
      description: 'Cuts, pacing, and transitions explained with examples.',
      visibleText: 'Transitions pacing cuts color grading workflow.',
    });
    const aiTools = makeItem('https://example.com/ai-tools', {
      title: 'AI tools for students',
      description: 'Prompt design, automation, and agent workflows.',
      visibleText: 'Prompt automation agents tool selection.',
    });

    const result = searchSmartLinks([transitions, aiTools], 'what did I save about transitions?');
    expect(result[0].id).toBe(transitions.id);
    expect(searchSmartLinks([transitions, aiTools], 'find beginner resources', { difficulty: 'beginner' }).length).toBeGreaterThan(0);
  });

  it('builds topic clusters and a learning path from saved items', () => {
    const videoBasics = makeItem('https://youtube.com/watch?v=basics', {
      title: 'Video editing basics',
      description: 'Intro to cuts and workflow.',
      visibleText: 'Basics workflow cuts.',
      note: 'Learn editing',
    });
    const transitions = makeItem(
      'https://youtube.com/watch?v=transitions',
      {
        title: 'Transitions and pacing',
        description: 'A focused guide on transitions and pacing.',
        visibleText: 'Transitions pacing cuts.',
      },
      [videoBasics]
    );
    const grading = makeItem(
      'https://youtube.com/watch?v=grading',
      {
        title: 'Color grading workflow',
        description: 'Practical grading examples.',
        visibleText: 'Color grading workflow LUT look.',
      },
      [videoBasics, transitions]
    );

    const clusters = buildTopicClusters([videoBasics, transitions, grading]);
    const videoCluster = clusters.find((cluster) => cluster.category === 'Video Editing');

    expect(videoCluster).toBeTruthy();
    expect(videoCluster?.itemCount).toBe(3);
    expect(videoCluster?.topTopics.length).toBeGreaterThan(0);

    const path = buildLearningPath([videoBasics, transitions, grading], 'Video Editing');
    expect(path).toBeTruthy();
    expect(path?.beginner.items.length).toBeGreaterThan(0);
    expect(path?.nextSteps.length).toBeGreaterThan(0);
  });

  it('generates reminders and analytics from revisit behavior', () => {
    const fresh = makeItem('https://example.com/fresh', {
      title: 'High value framework',
      description: 'Checklist and template.',
      visibleText: 'Checklist template framework.',
    });
    const oldUnused = makeItem('https://example.com/old', {
      title: 'Unused but important',
      description: 'A high value resource that was never revisited.',
      visibleText: 'Important checklist template.',
    });
    oldUnused.createdAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    oldUnused.usefulnessScore = 92;
    oldUnused.revisitCount = 0;

    const revisited = makeItem('https://example.com/revisited', {
      title: 'Revisited resource',
      description: 'Useful and reopened several times.',
      visibleText: 'Repeated learning.',
    });
    revisited.revisitCount = 3;
    revisited.lastOpenedAt = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    revisited.revisitStatus = 'revisited';

    const reminders = buildSmartLinkReminders([fresh, oldUnused, revisited]);
    expect(reminders.some((reminder) => reminder.kind === 'saved-7-days-ago' || reminder.kind === 'high-value-unused')).toBe(true);

    const analytics = buildSmartLinkAnalytics([fresh, oldUnused, revisited]);
    expect(analytics.totalSaved).toBe(3);
    expect(analytics.highValueContentCount).toBeGreaterThan(0);
    expect(analytics.weeklyActivity).toHaveLength(7);
  });

  it('answers questions from the saved library', () => {
    const transitions = makeItem('https://example.com/transitions', {
      title: 'Transitions for beginners',
      description: 'A beginner friendly edit guide.',
      visibleText: 'Transitions and pacing for beginner editors.',
    });
    const aiTools = makeItem('https://example.com/ai', {
      title: 'AI tools for students',
      description: 'Prompt design and automation.',
      visibleText: 'Prompt automation AI tools for students.',
    });

    const answer = answerSmartLinkQuestion('What should I learn next?', [transitions, aiTools]);
    expect(answer.answer.length).toBeGreaterThan(0);
    expect(answer.relatedItems.length).toBeGreaterThan(0);
    expect(answer.nextStep.length).toBeGreaterThan(0);
  });

  it('merges duplicate records without losing signals', () => {
    const primary = makeItem('https://example.com/primary', {
      title: 'Primary resource',
      description: 'Strong checklist and workflow for Premiere Pro.',
      visibleText: 'Premiere Pro checklist workflow.',
    });
    const duplicate = makeItem('https://example.com/duplicate', {
      title: 'Duplicate resource',
      description: 'Checklist and example for Figma.',
      visibleText: 'Figma checklist example.',
    });

    const merged = mergeSmartLinkRecords(primary, duplicate);
    expect(merged.tags.length).toBeGreaterThanOrEqual(primary.tags.length);
    expect(merged.toolsMentioned).toEqual(expect.arrayContaining(['Premiere Pro', 'Figma']));
    expect(merged.usefulnessScore).toBeGreaterThanOrEqual(primary.usefulnessScore);
  });
});
