import { getPageMetadata, type PageMetadata } from '../utils/fetchPageContent';
import {
  SMART_LINK_DEFAULT_CATEGORIES,
  type SmartLinkAnalysisCacheEntry,
  type SmartLinkAnalysisSnapshot,
  type SmartLinkAnalytics,
  type SmartLinkAssistantAnswer,
  type SmartLinkBatchResult,
  type SmartLinkClusterCard,
  type SmartLinkContentSignals,
  type SmartLinkContentType,
  type SmartLinkDefaultCategory,
  type SmartLinkDifficultyLevel,
  type SmartLinkDuplicateMatch,
  type SmartLinkHubState,
  type SmartLinkIntentCategory,
  type SmartLinkItem,
  type SmartLinkLearningPath,
  type SmartLinkPathStage,
  type SmartLinkPriority,
  type SmartLinkProcessingStatus,
  type SmartLinkQueryFilters,
  type SmartLinkReminder,
  type SmartLinkSavedInput,
  type SmartLinkSourcePlatform,
} from './types';

type TopicDefinition = {
  topic: string;
  aliases: string[];
  practiceTasks: string[];
  miniProjects: string[];
};

type CategoryTopicMap = Record<string, TopicDefinition[]>;

const CATEGORY_TOPIC_MAP: CategoryTopicMap = {
  'Video Editing': [
    {
      topic: 'Basics',
      aliases: ['basics', 'intro', 'setup', 'workflow', 'fundamentals', 'beginner', 'editing 101'],
      practiceTasks: ['Trim a 30 second clip into three clean cuts.', 'Rewrite the order of one scene to make it clearer.'],
      miniProjects: ['Edit a 20 second intro sequence.', 'Create a before/after comparison clip.'],
    },
    {
      topic: 'Cuts and Pacing',
      aliases: ['cuts', 'cutting', 'pacing', 'timing', 'rhythm', 'sequence', 'story pace'],
      practiceTasks: ['Re-edit one clip for tighter pacing.', 'Remove one unnecessary pause from a sequence.'],
      miniProjects: ['Make a retention-focused short edit.', 'Create a fast cut montage with three rhythm shifts.'],
    },
    {
      topic: 'Transitions',
      aliases: ['transition', 'transitions', 'match cut', 'j cut', 'l cut', 'scene change'],
      practiceTasks: ['Add three different transitions to the same scene.', 'Compare hard cuts vs smooth transitions.'],
      miniProjects: ['Build a transition showcase reel.', 'Create a mini story using only transition changes.'],
    },
    {
      topic: 'Color Grading',
      aliases: ['color grading', 'color correction', 'grading', 'look', 'lut', 'tone'],
      practiceTasks: ['Match two clips with the same color feel.', 'Warm up or cool down a scene intentionally.'],
      miniProjects: ['Create a before/after grading reel.', 'Build three looks for the same shot.'],
    },
    {
      topic: 'Audio Editing',
      aliases: ['audio', 'sound', 'sound design', 'noise reduction', 'mixing', 'voice cleanup'],
      practiceTasks: ['Clean one noisy voice clip.', 'Balance dialogue and music levels once.'],
      miniProjects: ['Create a simple sound design pass for a short edit.', 'Build a voice cleanup checklist.'],
    },
    {
      topic: 'Motion Graphics',
      aliases: ['motion graphics', 'after effects', 'animation', 'titles', 'lower thirds', 'kinetic'],
      practiceTasks: ['Animate a lower third with consistent spacing.', 'Add one motion accent to an intro.'],
      miniProjects: ['Make a motion title pack.', 'Build a short motion reel from three scenes.'],
    },
    {
      topic: 'Storytelling',
      aliases: ['storytelling', 'narrative', 'hook', 'retention', 'structure', 'arc'],
      practiceTasks: ['Write a one-line hook before editing.', 'Identify the strongest moment in a clip.'],
      miniProjects: ['Edit a short story arc from raw footage.', 'Create a retention-first reel concept.'],
    },
    {
      topic: 'Workflow',
      aliases: ['premiere', 'final cut', 'davinci', 'capcut', 'shortcut', 'workflow', 'timeline'],
      practiceTasks: ['Set up one reusable editing template.', 'Create shortcut muscle memory for one task.'],
      miniProjects: ['Build a repeatable edit workflow checklist.', 'Create a template project for future edits.'],
    },
    {
      topic: 'Portfolio Practice',
      aliases: ['portfolio', 'showreel', 'practice project', 'case study', 'before after', 'sample edit'],
      practiceTasks: ['Turn one saved idea into a portfolio piece.', 'Write one short caption for a finished edit.'],
      miniProjects: ['Build a three-piece reel portfolio.', 'Create a mini case study showing process and result.'],
    },
  ],
  'AI Tools': [
    {
      topic: 'Prompt Design',
      aliases: ['prompt', 'prompts', 'prompting', 'prompt design', 'instruction'],
      practiceTasks: ['Rewrite one prompt with clearer constraints.', 'Test the same prompt with one changed variable.'],
      miniProjects: ['Create a prompt library for one workflow.', 'Build a reusable prompt template pack.'],
    },
    {
      topic: 'Automation',
      aliases: ['automation', 'automate', 'workflow', 'zapier', 'make', 'n8n', 'trigger'],
      practiceTasks: ['Automate one repetitive step.', 'Document a trigger-action chain in one sentence.'],
      miniProjects: ['Design a small automation pipeline.', 'Build a weekly auto-sorting workflow.'],
    },
    {
      topic: 'Agents',
      aliases: ['agent', 'agents', 'autonomous', 'multi-agent'],
      practiceTasks: ['Describe one task an agent should own.', 'List one guardrail for an agent workflow.'],
      miniProjects: ['Sketch a task-specific agent flow.', 'Prototype a helper agent for one process.'],
    },
    {
      topic: 'Tool Selection',
      aliases: ['tool', 'tools', 'stack', 'compare', 'choice', 'best tool'],
      practiceTasks: ['Compare two tools on one real use case.', 'Write a one-line rule for choosing a tool.'],
      miniProjects: ['Build a personal AI stack map.', 'Create a tool comparison cheat sheet.'],
    },
    {
      topic: 'Evaluation',
      aliases: ['evaluate', 'eval', 'testing', 'quality', 'accuracy', 'benchmark'],
      practiceTasks: ['Define a quality check for one output.', 'Score one output with a simple rubric.'],
      miniProjects: ['Create a prompt evaluation grid.', 'Build a before/after quality checklist.'],
    },
    {
      topic: 'Safety',
      aliases: ['safety', 'guardrails', 'hallucination', 'risk', 'privacy'],
      practiceTasks: ['Write one rule for verifying outputs.', 'Mark one risky step in your workflow.'],
      miniProjects: ['Create an AI use policy for yourself.', 'Make a safety checklist for shared outputs.'],
    },
    {
      topic: 'Multimodal',
      aliases: ['multimodal', 'image', 'video', 'voice', 'audio', 'vision'],
      practiceTasks: ['Check one prompt with an image or voice input.', 'List one use case for multimodal input.'],
      miniProjects: ['Build a multimodal content pipeline.', 'Create a voice-plus-image workflow draft.'],
    },
    {
      topic: 'Research',
      aliases: ['research', 'search', 'retrieval', 'rag', 'source', 'grounding'],
      practiceTasks: ['Collect two sources for one answer.', 'Write one note on source quality.'],
      miniProjects: ['Build a small research assistant flow.', 'Create a source-grounded knowledge pack.'],
    },
    {
      topic: 'Use Cases',
      aliases: ['use case', 'workflow', 'examples', 'application', 'scenario'],
      practiceTasks: ['Describe one business case in one sentence.', 'Map one workflow to one outcome.'],
      miniProjects: ['Create a use-case idea board.', 'Design three AI use case templates.'],
    },
  ],
  Business: [
    {
      topic: 'Positioning',
      aliases: ['positioning', 'niche', 'offer', 'market fit', 'differentiation'],
      practiceTasks: ['Write one sentence on who this is for.', 'Compare one offer against an alternative.'],
      miniProjects: ['Draft a positioning page.', 'Build a simple offer map.'],
    },
    {
      topic: 'Offer Design',
      aliases: ['offer', 'package', 'service', 'deliverable', 'bundle'],
      practiceTasks: ['Turn one service into a clear package.', 'List the deliverables for one offer.'],
      miniProjects: ['Create a service menu.', 'Design a premium vs starter offer ladder.'],
    },
    {
      topic: 'Pricing',
      aliases: ['pricing', 'price', 'rate', 'revenue', 'margin'],
      practiceTasks: ['Set a floor price for one offer.', 'Compare hourly vs package pricing.'],
      miniProjects: ['Create a pricing calculator draft.', 'Build a simple pricing page.'],
    },
    {
      topic: 'Sales',
      aliases: ['sales', 'pitch', 'close', 'client', 'conversion'],
      practiceTasks: ['Write one short pitch line.', 'List one objection and answer.'],
      miniProjects: ['Create a lead follow-up sequence.', 'Build a sales discovery checklist.'],
    },
    {
      topic: 'Operations',
      aliases: ['operations', 'ops', 'process', 'delivery', 'handoff'],
      practiceTasks: ['Document one repeatable process.', 'Remove one manual handoff step.'],
      miniProjects: ['Build an operations checklist.', 'Create a delivery SOP template.'],
    },
    {
      topic: 'Customer Research',
      aliases: ['customer research', 'user research', 'feedback', 'interview', 'pain point'],
      practiceTasks: ['Write one customer question.', 'Capture one pain point in plain language.'],
      miniProjects: ['Create a customer interview script.', 'Build a research notes template.'],
    },
    {
      topic: 'Systems',
      aliases: ['systems', 'process', 'workflow', 'automation', 'repeatable'],
      practiceTasks: ['Replace one ad hoc task with a system.', 'List one system that saves time.'],
      miniProjects: ['Build a business systems map.', 'Create a weekly review dashboard.'],
    },
    {
      topic: 'Revenue',
      aliases: ['revenue', 'income', 'cash flow', 'profit', 'growth'],
      practiceTasks: ['Track one source of income.', 'Write one revenue goal for the month.'],
      miniProjects: ['Build a simple revenue tracker.', 'Map one growth experiment.'],
    },
  ],
  Marketing: [
    {
      topic: 'Hooks',
      aliases: ['hook', 'hooks', 'headline', 'openers', 'attention'],
      practiceTasks: ['Rewrite one hook to be shorter.', 'Test one stronger opening line.'],
      miniProjects: ['Create 20 hook ideas.', 'Build a hook swipe file.'],
    },
    {
      topic: 'Messaging',
      aliases: ['messaging', 'copy', 'positioning', 'angle', 'claim'],
      practiceTasks: ['Reduce one message to one line.', 'Test one value statement.'],
      miniProjects: ['Draft a messaging framework.', 'Build a mini brand voice guide.'],
    },
    {
      topic: 'Content Strategy',
      aliases: ['content strategy', 'content plan', 'content pillar', 'series'],
      practiceTasks: ['Turn one topic into three posts.', 'Define one content pillar.'],
      miniProjects: ['Build a 30-day content map.', 'Create a pillar-to-post system.'],
    },
    {
      topic: 'Funnels',
      aliases: ['funnel', 'funnels', 'landing page', 'lead magnet', 'conversion'],
      practiceTasks: ['Map one customer journey step.', 'Write one CTA.'],
      miniProjects: ['Create a simple funnel diagram.', 'Build a lead capture flow.'],
    },
    {
      topic: 'SEO',
      aliases: ['seo', 'search', 'keyword', 'rank', 'organic'],
      practiceTasks: ['Pick one target keyword.', 'Write one page title idea.'],
      miniProjects: ['Create an SEO outline.', 'Draft a keyword content cluster.'],
    },
    {
      topic: 'Distribution',
      aliases: ['distribution', 'reach', 'share', 'audience', 'channel'],
      practiceTasks: ['List one distribution channel.', 'Repost one asset in a new format.'],
      miniProjects: ['Build a distribution matrix.', 'Create a content repurposing flow.'],
    },
    {
      topic: 'Conversion',
      aliases: ['conversion', 'ctr', 'click', 'signup', 'purchase'],
      practiceTasks: ['Make one CTA clearer.', 'Compare one version against another.'],
      miniProjects: ['Create a conversion checklist.', 'Design a higher-CTR variant.'],
    },
    {
      topic: 'Analytics',
      aliases: ['analytics', 'metrics', 'data', 'dashboard', 'tracking'],
      practiceTasks: ['Track one KPI this week.', 'Write one insight from the numbers.'],
      miniProjects: ['Build a simple marketing dashboard.', 'Create a weekly metrics review.'],
    },
  ],
  Coding: [
    {
      topic: 'Fundamentals',
      aliases: ['fundamentals', 'basics', 'syntax', 'language', 'logic'],
      practiceTasks: ['Write one function from memory.', 'Explain one concept in plain language.'],
      miniProjects: ['Build a tiny utility app.', 'Create a fundamentals cheat sheet.'],
    },
    {
      topic: 'Debugging',
      aliases: ['debugging', 'bug', 'troubleshoot', 'error', 'fix'],
      practiceTasks: ['Trace one error to its source.', 'Write one debugging checklist.'],
      miniProjects: ['Build a bug hunt notebook.', 'Create a debug workflow diagram.'],
    },
    {
      topic: 'APIs',
      aliases: ['api', 'apis', 'endpoint', 'request', 'response'],
      practiceTasks: ['Describe one request-response flow.', 'Inspect one API payload.'],
      miniProjects: ['Build a small API client.', 'Create an endpoint reference card.'],
    },
    {
      topic: 'Architecture',
      aliases: ['architecture', 'system design', 'structure', 'scalability'],
      practiceTasks: ['Draw one component boundary.', 'Name one scalability tradeoff.'],
      miniProjects: ['Sketch an app architecture map.', 'Create a modular design plan.'],
    },
    {
      topic: 'State Management',
      aliases: ['state', 'state management', 'store', 'context', 'redux'],
      practiceTasks: ['List one piece of local state.', 'Move one repeated state into a shared store.'],
      miniProjects: ['Build a state map for one app.', 'Create a reducer exercise.'],
    },
    {
      topic: 'Testing',
      aliases: ['testing', 'unit test', 'integration test', 'e2e', 'vitest', 'jest'],
      practiceTasks: ['Write one test case from the user flow.', 'Name one edge case.'],
      miniProjects: ['Create a test checklist.', 'Build a tiny test suite.'],
    },
    {
      topic: 'Deployment',
      aliases: ['deployment', 'deploy', 'hosting', 'vercel', 'build'],
      practiceTasks: ['List one deploy step.', 'Check one build artifact.'],
      miniProjects: ['Create a deployment checklist.', 'Build a release notes template.'],
    },
    {
      topic: 'Performance',
      aliases: ['performance', 'speed', 'optimization', 'cache', 'lazy load'],
      practiceTasks: ['Remove one unnecessary render.', 'Cache one repeated calculation.'],
      miniProjects: ['Create a performance audit list.', 'Build a speed improvement plan.'],
    },
  ],
  Design: [
    {
      topic: 'Layout',
      aliases: ['layout', 'grid', 'spacing', 'composition', 'alignment'],
      practiceTasks: ['Rearrange one card for better hierarchy.', 'Check spacing consistency once.'],
      miniProjects: ['Build a layout reference board.', 'Create a hero section mock.'],
    },
    {
      topic: 'Typography',
      aliases: ['typography', 'type', 'font', 'reading', 'hierarchy'],
      practiceTasks: ['Choose one type scale.', 'Test one heading size change.'],
      miniProjects: ['Create a type pairing sheet.', 'Build a typography style card.'],
    },
    {
      topic: 'Color',
      aliases: ['color', 'palette', 'contrast', 'tone', 'gradient'],
      practiceTasks: ['Pick one accent color purposefully.', 'Check one contrast ratio.'],
      miniProjects: ['Create a color system board.', 'Build a palette generator note.'],
    },
    {
      topic: 'Branding',
      aliases: ['branding', 'brand', 'identity', 'visual identity', 'logo'],
      practiceTasks: ['Write one brand trait.', 'Compare two visual directions.'],
      miniProjects: ['Draft a brand kit.', 'Create a one-page identity guide.'],
    },
    {
      topic: 'UX Research',
      aliases: ['ux research', 'user research', 'interview', 'feedback', 'usability'],
      practiceTasks: ['List one user question.', 'Note one friction point.'],
      miniProjects: ['Create a research script.', 'Build a feedback synthesis note.'],
    },
    {
      topic: 'Accessibility',
      aliases: ['accessibility', 'a11y', 'contrast', 'keyboard', 'screen reader'],
      practiceTasks: ['Check one keyboard path.', 'Audit one color contrast issue.'],
      miniProjects: ['Create an accessibility checklist.', 'Build an inclusive UI note.'],
    },
    {
      topic: 'Motion',
      aliases: ['motion', 'animation', 'transition', 'microinteraction', 'framer motion'],
      practiceTasks: ['Add one subtle motion change.', 'Compare motion on and off.'],
      miniProjects: ['Create a motion style guide.', 'Build a microinteraction library.'],
    },
    {
      topic: 'Design Systems',
      aliases: ['design system', 'component library', 'tokens', 'system', 'ui kit'],
      practiceTasks: ['Document one reusable component.', 'Define one token set.'],
      miniProjects: ['Create a design system starter.', 'Build a component inventory.'],
    },
  ],
  Productivity: [
    {
      topic: 'Planning',
      aliases: ['planning', 'plan', 'schedule', 'roadmap', 'calendar'],
      practiceTasks: ['Block one focused work session.', 'Plan one small outcome.'],
      miniProjects: ['Create a weekly planning template.', 'Build a simple roadmap card.'],
    },
    {
      topic: 'Habits',
      aliases: ['habit', 'habits', 'routine', 'consistency', 'discipline'],
      practiceTasks: ['Attach one habit to a trigger.', 'Track one streak for a week.'],
      miniProjects: ['Create a habit loop map.', 'Build a streak tracker.'],
    },
    {
      topic: 'Focus',
      aliases: ['focus', 'deep work', 'attention', 'pomodoro', 'distraction'],
      practiceTasks: ['Remove one distraction source.', 'Do one focused 25 minute sprint.'],
      miniProjects: ['Create a focus ritual checklist.', 'Build a distraction audit.'],
    },
    {
      topic: 'Task Management',
      aliases: ['task', 'tasks', 'todo', 'inbox', 'priority'],
      practiceTasks: ['Sort one inbox into actions.', 'Convert one vague task into a next step.'],
      miniProjects: ['Create a task triage board.', 'Build a weekly review flow.'],
    },
    {
      topic: 'Automation',
      aliases: ['automation', 'automate', 'shortcut', 'workflow', 'repeatable'],
      practiceTasks: ['Automate one repeated action.', 'Document one shortcut or template.'],
      miniProjects: ['Build an automation map.', 'Create a template-first workflow.'],
    },
    {
      topic: 'Review Cycles',
      aliases: ['review', 'weekly review', 'retrospective', 'reflect', 'check-in'],
      practiceTasks: ['Review one list at the end of the day.', 'Write one win and one fix.'],
      miniProjects: ['Create a weekly review checklist.', 'Build a reflection card.'],
    },
    {
      topic: 'Note Taking',
      aliases: ['note taking', 'notes', 'capture', 'knowledge', 'second brain'],
      practiceTasks: ['Capture one note in a reusable format.', 'Link one note to a related idea.'],
      miniProjects: ['Create a note taxonomy.', 'Build a capture-to-review flow.'],
    },
    {
      topic: 'Systems',
      aliases: ['systems', 'workflow', 'process', 'processes', 'cadence'],
      practiceTasks: ['Turn one habit into a system.', 'Remove one manual decision.'],
      miniProjects: ['Create a system map.', 'Build a repeatable weekly process.'],
    },
  ],
  Education: [
    {
      topic: 'Learning Methods',
      aliases: ['learning methods', 'study method', 'active recall', 'spaced repetition', 'learn'],
      practiceTasks: ['Write one concept from memory.', 'Schedule one revisit.'],
      miniProjects: ['Create a study method cheat sheet.', 'Build a learning routine.'],
    },
    {
      topic: 'Practice',
      aliases: ['practice', 'drill', 'exercise', 'repeat', 'application'],
      practiceTasks: ['Repeat one skill twice today.', 'Turn one theory into a task.'],
      miniProjects: ['Create a practice ladder.', 'Build a micro practice sprint.'],
    },
    {
      topic: 'Recall',
      aliases: ['recall', 'memory', 'quiz', 'flashcard', 'retrieval'],
      practiceTasks: ['Quiz yourself without notes.', 'Write three recall questions.'],
      miniProjects: ['Create flashcards from one resource.', 'Build a recall review deck.'],
    },
    {
      topic: 'Projects',
      aliases: ['project', 'projects', 'portfolio', 'build', 'ship'],
      practiceTasks: ['Turn one lesson into a project.', 'Publish one small result.'],
      miniProjects: ['Build a mini project plan.', 'Create a project showcase card.'],
    },
    {
      topic: 'Feedback',
      aliases: ['feedback', 'review', 'critique', 'improve', 'iteration'],
      practiceTasks: ['Ask one person for feedback.', 'Apply one suggestion immediately.'],
      miniProjects: ['Create a feedback log.', 'Build an iteration tracker.'],
    },
    {
      topic: 'Curriculum',
      aliases: ['curriculum', 'syllabus', 'roadmap', 'sequence', 'path'],
      practiceTasks: ['Order three topics in a better sequence.', 'Find the missing first step.'],
      miniProjects: ['Create a learning roadmap.', 'Build a syllabus outline.'],
    },
    {
      topic: 'Assessment',
      aliases: ['assessment', 'test', 'benchmark', 'evaluate', 'check'],
      practiceTasks: ['Measure one skill today.', 'Write one checkpoint question.'],
      miniProjects: ['Create a progress scorecard.', 'Build a self-assessment template.'],
    },
  ],
  Research: [
    {
      topic: 'Literature Review',
      aliases: ['literature review', 'review', 'survey', 'background', 'related work'],
      practiceTasks: ['Summarize one paper in one paragraph.', 'Compare two sources on one point.'],
      miniProjects: ['Create a reading matrix.', 'Build a source summary board.'],
    },
    {
      topic: 'Methods',
      aliases: ['methods', 'methodology', 'approach', 'protocol', 'procedure'],
      practiceTasks: ['Identify the method in one article.', 'Note one methodological tradeoff.'],
      miniProjects: ['Create a methods comparison note.', 'Build a research design sketch.'],
    },
    {
      topic: 'Citations',
      aliases: ['citations', 'references', 'source', 'bibliography', 'reference'],
      practiceTasks: ['Record one citation cleanly.', 'Check one source format.'],
      miniProjects: ['Create a citation template.', 'Build a source archive.'],
    },
    {
      topic: 'Synthesis',
      aliases: ['synthesis', 'summary', 'insight', 'combine', 'pattern'],
      practiceTasks: ['Write one synthesized takeaway.', 'Compare two findings in a sentence.'],
      miniProjects: ['Create a synthesis map.', 'Build an insight board.'],
    },
    {
      topic: 'Data',
      aliases: ['data', 'dataset', 'statistics', 'results', 'analysis'],
      practiceTasks: ['Inspect one metric carefully.', 'Write one data note.'],
      miniProjects: ['Create a data notes sheet.', 'Build a results summary card.'],
    },
    {
      topic: 'Reliability',
      aliases: ['reliability', 'bias', 'quality', 'validity', 'trust'],
      practiceTasks: ['Mark one source as strong or weak.', 'Write one limitation.'],
      miniProjects: ['Create a source trust rubric.', 'Build a reliability checklist.'],
    },
    {
      topic: 'Ethics',
      aliases: ['ethics', 'ethical', 'privacy', 'responsibility', 'bias'],
      practiceTasks: ['Note one ethical risk.', 'Write one privacy concern.'],
      miniProjects: ['Create a research ethics card.', 'Build a responsible-use note.'],
    },
  ],
  Finance: [
    {
      topic: 'Budgeting',
      aliases: ['budget', 'budgeting', 'spend', 'expense', 'allocation'],
      practiceTasks: ['Track one expense category.', 'Set a spending cap once.'],
      miniProjects: ['Build a budgeting sheet.', 'Create a monthly money map.'],
    },
    {
      topic: 'Cashflow',
      aliases: ['cashflow', 'cash flow', 'income', 'outflow', 'runway'],
      practiceTasks: ['List one incoming and outgoing flow.', 'Estimate one month of runway.'],
      miniProjects: ['Create a cashflow tracker.', 'Build a revenue cadence chart.'],
    },
    {
      topic: 'Investing',
      aliases: ['investing', 'investment', 'portfolio', 'asset', 'equity'],
      practiceTasks: ['Write one investment principle.', 'Compare two options carefully.'],
      miniProjects: ['Create an investing notes board.', 'Build a risk-return sketch.'],
    },
    {
      topic: 'Taxes',
      aliases: ['tax', 'taxes', 'deduction', 'compliance', 'filing'],
      practiceTasks: ['Record one deductible item.', 'Note one filing deadline.'],
      miniProjects: ['Create a tax prep checklist.', 'Build a filing calendar.'],
    },
    {
      topic: 'Pricing',
      aliases: ['pricing', 'price', 'rate', 'margin', 'fee'],
      practiceTasks: ['Calculate one price floor.', 'Compare package vs hourly pricing.'],
      miniProjects: ['Create a pricing calculator.', 'Build a service pricing ladder.'],
    },
    {
      topic: 'Metrics',
      aliases: ['metrics', 'kpi', 'goal', 'target', 'benchmark'],
      practiceTasks: ['Pick one metric to watch.', 'Write one target number.'],
      miniProjects: ['Create a metrics dashboard.', 'Build a KPI review card.'],
    },
    {
      topic: 'Risk',
      aliases: ['risk', 'volatility', 'drawdown', 'uncertainty', 'safety'],
      practiceTasks: ['Write one risk assumption.', 'Limit one exposure area.'],
      miniProjects: ['Create a risk checklist.', 'Build a downside planning note.'],
    },
  ],
  Motivation: [
    {
      topic: 'Mindset',
      aliases: ['mindset', 'belief', 'perspective', 'self talk', 'attitude'],
      practiceTasks: ['Write one helpful reframe.', 'Notice one limiting belief.'],
      miniProjects: ['Create a mindset note.', 'Build a self-talk card.'],
    },
    {
      topic: 'Discipline',
      aliases: ['discipline', 'consistency', 'control', 'routine', 'focus'],
      practiceTasks: ['Keep one promise to yourself today.', 'Do one uncomfortable task early.'],
      miniProjects: ['Create a discipline challenge.', 'Build a streak tracker.'],
    },
    {
      topic: 'Habits',
      aliases: ['habit', 'habits', 'routine', 'trigger', 'loop'],
      practiceTasks: ['Attach one habit to a cue.', 'Track one habit tomorrow.'],
      miniProjects: ['Create a habit loop map.', 'Build a two-minute habit plan.'],
    },
    {
      topic: 'Confidence',
      aliases: ['confidence', 'belief', 'self trust', 'trust', 'assurance'],
      practiceTasks: ['List one proof of progress.', 'Practice one small win.'],
      miniProjects: ['Create a confidence log.', 'Build a self-belief board.'],
    },
    {
      topic: 'Consistency',
      aliases: ['consistency', 'repeat', 'steady', 'rhythm', 'habit'],
      practiceTasks: ['Repeat one action for three days.', 'Lower the bar for one action.'],
      miniProjects: ['Create a consistency calendar.', 'Build a low-friction routine map.'],
    },
    {
      topic: 'Routines',
      aliases: ['routine', 'routines', 'morning', 'evening', 'schedule'],
      practiceTasks: ['Set one morning anchor.', 'Simplify one evening step.'],
      miniProjects: ['Create a routine template.', 'Build a daily cadence card.'],
    },
  ],
  Entertainment: [
    {
      topic: 'Trends',
      aliases: ['trend', 'trends', 'viral', 'format', 'timing'],
      practiceTasks: ['List one trend that is relevant.', 'Track one format change.'],
      miniProjects: ['Create a trend watch list.', 'Build a short-form ideas board.'],
    },
    {
      topic: 'Formats',
      aliases: ['format', 'formats', 'series', 'episode', 'structure'],
      practiceTasks: ['Rewrite one idea in a new format.', 'Compare two format lengths.'],
      miniProjects: ['Create a format library.', 'Build a multi-format content plan.'],
    },
    {
      topic: 'Storytelling',
      aliases: ['storytelling', 'story', 'arc', 'narrative', 'hook'],
      practiceTasks: ['Write one opening line.', 'Name the payoff moment.'],
      miniProjects: ['Create a short story reel.', 'Build a narrative sequence.'],
    },
    {
      topic: 'Timing',
      aliases: ['timing', 'pace', 'pacing', 'beat', 'rhythm'],
      practiceTasks: ['Trim one beat earlier.', 'Make one pause shorter.'],
      miniProjects: ['Create a timing practice reel.', 'Build a pacing checklist.'],
    },
    {
      topic: 'Retention',
      aliases: ['retention', 'watch time', 'hold', 'attention', 'keep'],
      practiceTasks: ['Add one retention hook.', 'Remove one boring section.'],
      miniProjects: ['Create a retention map.', 'Build a hook-to-payoff sequence.'],
    },
    {
      topic: 'Humor',
      aliases: ['humor', 'funny', 'joke', 'laugh', 'playful'],
      practiceTasks: ['Add one playful line.', 'Test one comedic beat.'],
      miniProjects: ['Create a joke bank.', 'Build a humorous reel concept.'],
    },
  ],
  Miscellaneous: [
    {
      topic: 'General',
      aliases: ['general', 'misc', 'mixed', 'other', 'reference'],
      practiceTasks: ['Extract one useful note.', 'Tag it with one topic later.'],
      miniProjects: ['Create a catch-all board.', 'Build a simple filing rule.'],
    },
    {
      topic: 'Reference',
      aliases: ['reference', 'cheat sheet', 'lookup', 'quick reference'],
      practiceTasks: ['Save one quick lookup point.', 'Add one supporting note.'],
      miniProjects: ['Create a reference library.', 'Build a lookup card.'],
    },
    {
      topic: 'Other',
      aliases: ['other', 'unclear', 'unknown'],
      practiceTasks: ['Give this link one descriptive tag.', 'Check whether it belongs in another category.'],
      miniProjects: ['Create a note for later review.', 'Build an organization rule.'],
    },
  ],
};

const SOURCE_PLATFORM_PATTERNS: Array<{
  platform: SmartLinkSourcePlatform;
  label: string;
  hostMatches: string[];
}> = [
  { platform: 'youtube', label: 'YouTube', hostMatches: ['youtube.com', 'youtu.be', 'm.youtube.com'] },
  { platform: 'instagram', label: 'Instagram', hostMatches: ['instagram.com', 'instagr.am'] },
  { platform: 'threads', label: 'Threads', hostMatches: ['threads.net'] },
  { platform: 'x', label: 'X / Twitter', hostMatches: ['x.com', 'twitter.com', 't.co'] },
  { platform: 'blog', label: 'Blog', hostMatches: ['medium.com', 'substack.com', 'dev.to', 'hashnode.dev'] },
  { platform: 'research', label: 'Research', hostMatches: ['arxiv.org', 'doi.org', 'research.google', 'scholar.google'] },
  { platform: 'course', label: 'Course', hostMatches: ['coursera.org', 'udemy.com', 'skillshare.com', 'edx.org', 'khanacademy.org'] },
  { platform: 'tool', label: 'Tool', hostMatches: ['github.com', 'producthunt.com', 'figma.com', 'notion.so', 'openai.com'] },
  { platform: 'pdf', label: 'PDF', hostMatches: ['.pdf'] },
  { platform: 'tutorial', label: 'Tutorial', hostMatches: ['freecodecamp.org', 'css-tricks.com', 'w3schools.com', 'tutorial'] },
];

const TOOL_LIBRARY: Array<{ label: string; aliases: string[] }> = [
  { label: 'Premiere Pro', aliases: ['premiere pro', 'premiere'] },
  { label: 'After Effects', aliases: ['after effects', 'ae'] },
  { label: 'DaVinci Resolve', aliases: ['davinci resolve', 'davinci'] },
  { label: 'CapCut', aliases: ['capcut'] },
  { label: 'Figma', aliases: ['figma'] },
  { label: 'Canva', aliases: ['canva'] },
  { label: 'Notion', aliases: ['notion'] },
  { label: 'Obsidian', aliases: ['obsidian'] },
  { label: 'ChatGPT', aliases: ['chatgpt', 'chat gpt'] },
  { label: 'Gemini', aliases: ['gemini'] },
  { label: 'Claude', aliases: ['claude'] },
  { label: 'Cursor', aliases: ['cursor'] },
  { label: 'VS Code', aliases: ['vs code', 'vscode'] },
  { label: 'n8n', aliases: ['n8n'] },
  { label: 'Zapier', aliases: ['zapier'] },
  { label: 'Make', aliases: ['make.com', 'make'] },
  { label: 'Runway', aliases: ['runway'] },
  { label: 'Miro', aliases: ['miro'] },
];

const FRAMEWORK_LIBRARY: Array<{ label: string; aliases: string[] }> = [
  { label: 'AIDA', aliases: ['aida'] },
  { label: 'PAS', aliases: ['pas'] },
  { label: 'SWOT', aliases: ['swot'] },
  { label: 'JTBD', aliases: ['jtbd', 'jobs to be done'] },
  { label: 'Eisenhower Matrix', aliases: ['eisenhower', 'eisenhower matrix'] },
  { label: 'Pomodoro', aliases: ['pomodoro'] },
  { label: '80/20', aliases: ['80/20', 'pareto'] },
  { label: 'GTD', aliases: ['gtd', 'getting things done'] },
  { label: 'SMART Goals', aliases: ['smart goals', 'smart goal'] },
  { label: 'SCAMPER', aliases: ['scamper'] },
];

const SYNONYM_GROUPS: Array<{ primary: string; aliases: string[] }> = [
  { primary: 'transition', aliases: ['transitions', 'cut', 'cuts', 'match cut', 'j cut', 'l cut', 'scene change'] },
  { primary: 'color grading', aliases: ['color correction', 'lut', 'look', 'grading'] },
  { primary: 'audio editing', aliases: ['sound design', 'sound', 'noise reduction', 'mixing', 'voice cleanup'] },
  { primary: 'motion graphics', aliases: ['motion', 'animation', 'after effects', 'titles', 'lower thirds'] },
  { primary: 'prompting', aliases: ['prompt design', 'prompting', 'prompt'] },
  { primary: 'automation', aliases: ['automate', 'workflow', 'trigger', 'shortcut'] },
  { primary: 'debugging', aliases: ['bug', 'troubleshoot', 'fix'] },
  { primary: 'learning', aliases: ['study', 'learn', 'education', 'practice'] },
  { primary: 'research', aliases: ['paper', 'papers', 'source', 'citation', 'literature review'] },
  { primary: 'productivity', aliases: ['focus', 'habits', 'task management', 'systems'] },
];

const COMMON_STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'you',
  'your',
  'into',
  'about',
  'what',
  'which',
  'when',
  'where',
  'why',
  'how',
  'are',
  'was',
  'were',
  'will',
  'can',
  'could',
  'should',
  'would',
  'have',
  'has',
  'had',
  'a',
  'an',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'it',
  'is',
  'as',
  'or',
  'if',
  'be',
  'best',
  'new',
  'official',
  'link',
  'links',
  'website',
  'page',
  'pages',
  'content',
  'article',
  'video',
  'watch',
  'read',
  'save',
  'saved',
  'free',
  'guide',
  'tutorial',
  'course',
  'today',
  'use',
  'using',
  'thing',
  'things',
  'make',
  'made',
  'some',
  'more',
  'most',
  'very',
  'also',
  'there',
  'their',
  'them',
  'into',
  'over',
  'under',
  'get',
  'got',
  'one',
  'two',
  'three',
  'first',
  'second',
  'third',
  'just',
  'like',
  'know',
  'need',
  'want',
  'show',
  'find',
]);

const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  'Video Editing': ['video editing', 'edit', 'editing', 'reel', 'reels', 'shorts', 'timeline', 'transitions', 'color grading', 'audio'],
  'AI Tools': ['ai tools', 'ai', 'prompt', 'agent', 'automation', 'workflow', 'llm'],
  Business: ['business', 'offer', 'pricing', 'sales', 'revenue', 'client', 'operations'],
  Marketing: ['marketing', 'seo', 'content', 'hooks', 'funnels', 'copy', 'distribution'],
  Coding: ['coding', 'code', 'developer', 'api', 'testing', 'deployment', 'debugging'],
  Design: ['design', 'figma', 'typography', 'layout', 'branding', 'motion'],
  Productivity: ['productivity', 'habits', 'task', 'focus', 'notes', 'automation'],
  Education: ['education', 'learning', 'study', 'practice', 'curriculum'],
  Research: ['research', 'paper', 'study', 'methods', 'citations', 'data'],
  Finance: ['finance', 'money', 'budget', 'investing', 'tax', 'pricing'],
  Motivation: ['motivation', 'mindset', 'discipline', 'confidence', 'consistency'],
  Entertainment: ['entertainment', 'trend', 'formats', 'humor', 'storytelling', 'retention'],
  Miscellaneous: ['miscellaneous', 'other', 'reference'],
};

const DAY_MS = 24 * 60 * 60 * 1000;
const RELEVANCE_WINDOW_DAYS = [1, 7, 30];
const DEDUP_THRESHOLD = 0.72;

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const unique = <T,>(values: T[]): T[] => Array.from(new Set(values));

const titleCase = (value: string): string =>
  value
    .split(/[\s_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

const stripDiacritics = (value: string): string =>
  value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

const normalizeText = (value: string): string =>
  stripDiacritics(value.toLowerCase())
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string): string[] =>
  normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !COMMON_STOPWORDS.has(token));

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const nowIso = (): string => new Date().toISOString();

const createId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `slh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeoutId = globalThis.setTimeout(() => resolve(fallback), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }
  }
};

const buildSearchIndex = (...parts: Array<string | undefined>): string =>
  normalizeText(
    parts
      .filter(isNonEmptyString)
      .join(' ')
      .replace(/\s+/g, ' ')
  );

const getHost = (rawUrl: string): string => {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const isPdfUrl = (pathname: string): boolean => pathname.toLowerCase().endsWith('.pdf');

const stripTrackingParams = (url: URL): void => {
  const trackingParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'fbclid',
    'gclid',
    'mc_cid',
    'mc_eid',
    'ref',
    'ref_src',
    'feature',
    'si',
  ];
  trackingParams.forEach((param) => url.searchParams.delete(param));
};

const inferPlatformFromHost = (host: string): { platform: SmartLinkSourcePlatform; label: string } => {
  for (const pattern of SOURCE_PLATFORM_PATTERNS) {
    if (pattern.hostMatches.some((match) => match.startsWith('.') ? host.endsWith(match) : host.includes(match))) {
      return { platform: pattern.platform, label: pattern.label };
    }
  }

  return { platform: 'unknown', label: host ? host.split('.').slice(-2).join('.') || host : 'Unknown source' };
};

const inferPlatform = (url: string): { platform: SmartLinkSourcePlatform; label: string } => {
  const host = getHost(url);
  return inferPlatformFromHost(host);
};

const canonicalizeYouTubeUrl = (url: URL): URL => {
  const host = url.hostname.toLowerCase();
  if (host.includes('youtu.be')) {
    const videoId = url.pathname.replace('/', '').split('/')[0] || '';
    const nextUrl = new URL('https://www.youtube.com/watch');
    if (videoId) {
      nextUrl.searchParams.set('v', videoId);
    }
    return nextUrl;
  }

  if (url.pathname.toLowerCase().startsWith('/shorts/')) {
    const videoId = url.pathname.split('/shorts/')[1]?.split('/')[0] || '';
    const nextUrl = new URL('https://www.youtube.com/watch');
    if (videoId) {
      nextUrl.searchParams.set('v', videoId);
    }
    return nextUrl;
  }

  return url;
};

export const normalizeUrl = (rawUrl: string): string => {
  const candidate = rawUrl.trim();
  if (!candidate) {
    return '';
  }

  try {
    const url = new URL(candidate.startsWith('http') ? candidate : `https://${candidate}`);
    url.protocol = url.protocol.toLowerCase();
    url.hostname = url.hostname.toLowerCase();
    stripTrackingParams(url);

    const normalized = canonicalizeYouTubeUrl(url);
    normalized.hash = '';
    normalized.hostname = normalized.hostname.toLowerCase();
    stripTrackingParams(normalized);

    if (normalized.pathname !== '/' && normalized.pathname.endsWith('/')) {
      normalized.pathname = normalized.pathname.replace(/\/+$/g, '');
    }

    return normalized.toString();
  } catch {
    return candidate;
  }
};

export const parseUrlsFromText = (text: string): string[] => {
  if (!text.trim()) {
    return [];
  }

  const rawMatches = text.match(
    /(?:https?:\/\/|www\.)[^\s<>"'`]+|(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}(?:\/[^\s<>"'`]+)?/gi
  ) ?? [];

  const urls = rawMatches
    .map((candidate) => candidate.replace(/^[([{<]+|[)\]}>.,;!?]+$/g, '').trim())
    .filter(Boolean)
    .map((candidate) => {
      if (/^https?:\/\//i.test(candidate)) {
        return candidate;
      }
      if (/^(www\.)/i.test(candidate) || candidate.includes('.')) {
        return `https://${candidate}`;
      }
      return candidate;
    })
    .map((candidate) => {
      try {
        return normalizeUrl(candidate);
      } catch {
        return '';
      }
    })
    .filter((candidate) => {
      try {
        new URL(candidate);
        return true;
      } catch {
        return false;
      }
    });

  return unique(urls);
};

const CATEGORY_TOPIC_MATCHERS: Record<string, TopicDefinition[]> = CATEGORY_TOPIC_MAP;

const collectTopicMatches = (text: string, category: string): TopicDefinition[] => {
  const haystack = normalizeText(text);
  const definitions = CATEGORY_TOPIC_MATCHERS[category] ?? CATEGORY_TOPIC_MATCHERS.Miscellaneous;

  return definitions
    .map((definition) => {
      const matches = definition.aliases.filter((alias) => haystack.includes(normalizeText(alias)));
      const score = matches.length > 0 ? matches.length + definition.topic.split(' ').length * 0.1 : 0;
      return { definition, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.definition);
};

const countCategorySignals = (text: string, category: string): number => {
  const haystack = normalizeText(text);
  const terms = CATEGORY_SEARCH_TERMS[category] ?? [];
  return terms.reduce((count, term) => count + (haystack.includes(normalizeText(term)) ? 1 : 0), 0);
};

const inferCategory = (text: string, customCategory?: string): { category: string; confidence: number } => {
  if (isNonEmptyString(customCategory)) {
    return { category: normalizeWhitespace(customCategory), confidence: 100 };
  }

  const scores = SMART_LINK_DEFAULT_CATEGORIES.reduce<Record<string, number>>((acc, category) => {
    const signalCount = countCategorySignals(text, category);
    const topicCount = collectTopicMatches(text, category).length;
    acc[category] = signalCount * 2 + topicCount * 3;
    return acc;
  }, {});

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [bestCategory, bestScore] = entries[0] ?? ['Miscellaneous', 0];
  const secondScore = entries[1]?.[1] ?? 0;
  const confidence = bestScore <= 0 ? 18 : clamp(Math.round((bestScore / Math.max(bestScore + secondScore, 1)) * 100), 20, 98);
  return { category: bestCategory ?? 'Miscellaneous', confidence };
};

const inferPrimaryTopic = (text: string, category: string): { topic: string; matches: TopicDefinition[] } => {
  const matches = collectTopicMatches(text, category);
  if (matches.length > 0) {
    return { topic: matches[0].topic, matches };
  }

  const tokens = tokenize(text);
  const fallback = tokens.slice(0, 3).map(titleCase).join(' ');
  return {
    topic: fallback || 'General',
    matches: [],
  };
};

const inferContentType = (platform: SmartLinkSourcePlatform, text: string, pathname: string): SmartLinkContentType => {
  const haystack = normalizeText(text);
  if (isPdfUrl(pathname)) {
    return 'pdf';
  }
  if (platform === 'youtube') {
    return haystack.includes('short') || haystack.includes('reel') ? 'video' : 'video';
  }
  if (platform === 'instagram') {
    return haystack.includes('reel') ? 'reel' : 'reel';
  }
  if (platform === 'threads' || haystack.includes('thread')) {
    return 'thread';
  }
  if (platform === 'course' || haystack.includes('course') || haystack.includes('lesson') || haystack.includes('module')) {
    return 'course';
  }
  if (platform === 'research' || haystack.includes('research') || haystack.includes('paper') || haystack.includes('study')) {
    return 'research';
  }
  if (platform === 'tool' || haystack.includes('tool') || haystack.includes('template') || haystack.includes('workflow')) {
    return 'tool';
  }
  if (haystack.includes('tutorial') || haystack.includes('walkthrough')) {
    return 'tutorial';
  }
  if (haystack.includes('blog')) {
    return 'blog';
  }
  if (haystack.includes('article') || haystack.includes('read more')) {
    return 'article';
  }
  return 'webpage';
};

const inferIntentCategory = (text: string, contentType: SmartLinkContentType): SmartLinkIntentCategory => {
  const haystack = normalizeText(text);
  if (haystack.includes('inspiration') || haystack.includes('ideas') || haystack.includes('inspo')) {
    return 'inspiration';
  }
  if (haystack.includes('compare') || haystack.includes('vs') || haystack.includes('versus') || haystack.includes('best')) {
    return 'compare';
  }
  if (haystack.includes('research') || haystack.includes('paper') || haystack.includes('study')) {
    return 'research';
  }
  if (haystack.includes('build') || haystack.includes('create') || haystack.includes('project') || haystack.includes('ship')) {
    return 'build';
  }
  if (haystack.includes('reference') || haystack.includes('cheat sheet') || haystack.includes('template') || haystack.includes('checklist')) {
    return 'reference';
  }
  if (haystack.includes('buy') || haystack.includes('purchase') || haystack.includes('tool')) {
    return 'buy';
  }
  if (haystack.includes('track') || haystack.includes('save for later')) {
    return 'track';
  }
  if (contentType === 'video' || contentType === 'reel') {
    return 'watch';
  }
  if (contentType === 'course' || contentType === 'tutorial') {
    return 'learn';
  }
  return 'learn';
};

const inferDifficulty = (text: string): SmartLinkDifficultyLevel => {
  const haystack = normalizeText(text);
  if (/(advanced|deep dive|expert|masterclass|pro level|intermediate|mid level|production)/i.test(haystack)) {
    return haystack.includes('advanced') || haystack.includes('expert') || haystack.includes('masterclass') ? 'advanced' : 'intermediate';
  }
  if (/(beginner|basics|starter|intro|fundamentals|first steps)/i.test(haystack)) {
    return 'beginner';
  }
  return 'unknown';
};

const extractKeywords = (text: string, limit = 6): string[] => {
  const counts = new Map<string, number>();
  tokenize(text).forEach((token) => {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([token]) => titleCase(token));
};

const collectMatchedPhrases = (text: string, phrases: string[]): string[] => {
  const haystack = normalizeText(text);
  return phrases.filter((phrase) => haystack.includes(normalizeText(phrase)));
};

const inferToolsMentioned = (text: string): string[] => {
  const haystack = normalizeText(text);
  return unique(
    TOOL_LIBRARY.flatMap((tool) =>
      tool.aliases.some((alias) => haystack.includes(normalizeText(alias))) ? [tool.label] : []
    )
  );
};

const inferFrameworksMentioned = (text: string): string[] => {
  const haystack = normalizeText(text);
  return unique(
    FRAMEWORK_LIBRARY.flatMap((framework) =>
      framework.aliases.some((alias) => haystack.includes(normalizeText(alias))) ? [framework.label] : []
    )
  );
};

const getSummaryLead = (itemType: SmartLinkContentType, sourceLabel: string, primaryTopic: string): string => {
  switch (itemType) {
    case 'video':
      return `This saved video from ${sourceLabel} appears to focus on ${primaryTopic}.`;
    case 'reel':
      return `This saved reel from ${sourceLabel} appears to focus on ${primaryTopic}.`;
    case 'course':
      return `This saved course from ${sourceLabel} appears to focus on ${primaryTopic}.`;
    case 'research':
      return `This saved research item from ${sourceLabel} appears to focus on ${primaryTopic}.`;
    case 'tool':
      return `This saved tool-related link from ${sourceLabel} appears to focus on ${primaryTopic}.`;
    case 'pdf':
      return `This saved PDF from ${sourceLabel} appears to focus on ${primaryTopic}.`;
    case 'tutorial':
      return `This saved tutorial from ${sourceLabel} appears to focus on ${primaryTopic}.`;
    case 'thread':
      return `This saved thread from ${sourceLabel} appears to focus on ${primaryTopic}.`;
    case 'blog':
    case 'article':
      return `This saved article from ${sourceLabel} appears to focus on ${primaryTopic}.`;
    default:
      return `This saved link from ${sourceLabel} appears to focus on ${primaryTopic}.`;
  }
};

const buildActionableSteps = (contentType: SmartLinkContentType, intent: SmartLinkIntentCategory, note?: string): string[] => {
  const steps: string[] = [];
  steps.push('Open the saved link and capture one concrete takeaway.');

  if (contentType === 'video' || contentType === 'reel' || contentType === 'tutorial') {
    steps.push('Watch or scan it once, then rewrite the core idea in your own words.');
  } else if (contentType === 'course') {
    steps.push('Finish the smallest next lesson and write one practice task from it.');
  } else if (contentType === 'research') {
    steps.push('Record the claim, the method, and one limitation before moving on.');
  } else if (contentType === 'tool') {
    steps.push('Try the tool on one small workflow and note the fastest win.');
  } else if (contentType === 'pdf') {
    steps.push('Extract one checklist, framework, or example that you can reuse later.');
  } else {
    steps.push('Turn the idea into a 10-minute practice task today.');
  }

  if (intent === 'build') {
    steps.push('Convert it into a mini project or workflow prototype.');
  }
  if (intent === 'reference') {
    steps.push('Save one reusable line or checklist item so it is easy to revisit.');
  }
  if (note && note.trim()) {
    steps.push(`Connect the link to your note: ${note.trim().slice(0, 120)}.`);
  }

  return unique(steps).slice(0, 4);
};

const buildDetailedSummary = (
  signals: SmartLinkContentSignals,
  primaryTopic: string,
  intentCategory: SmartLinkIntentCategory,
  difficulty: SmartLinkDifficultyLevel,
  note?: string,
  reason?: string
): string[] => {
  const bullets: string[] = [];
  bullets.push(signals.pageTitle ? `Accessible title: ${signals.pageTitle}.` : 'Accessible title: unknown.');
  bullets.push(
    signals.description
      ? `Visible description suggests it is about ${primaryTopic.toLowerCase()}.`
      : `Visible description is unavailable, so the system is leaning on URL and page structure signals.`
  );
  bullets.push(
    `Intent looks like ${intentCategory === 'unknown' ? 'unknown' : intentCategory} and the likely difficulty is ${difficulty}.`
  );
  if (note && note.trim()) {
    bullets.push(`Your note adds context: ${note.trim().slice(0, 120)}.`);
  }
  if (reason && reason.trim()) {
    bullets.push(`Reason captured at save time: ${reason.trim().slice(0, 120)}.`);
  }
  return bullets;
};

const buildImportantPoints = (
  keywords: string[],
  toolsMentioned: string[],
  frameworksMentioned: string[],
  contentType: SmartLinkContentType,
  primaryTopic: string
): string[] => {
  const points: string[] = [];
  if (keywords[0]) {
    points.push(`Core theme: ${keywords[0]}.`);
  }
  if (keywords[1]) {
    points.push(`Secondary signal: ${keywords[1]}.`);
  }
  if (toolsMentioned[0]) {
    points.push(`Tool mention: ${toolsMentioned[0]}.`);
  }
  if (frameworksMentioned[0]) {
    points.push(`Framework mention: ${frameworksMentioned[0]}.`);
  }
  points.push(`Content type signal: ${contentType}.`);
  points.push(`Primary topic candidate: ${primaryTopic}.`);
  return unique(points).slice(0, 5);
};

const buildRelatedTopics = (primaryCategory: string, primaryTopic: string, subtopics: string[]): string[] => {
  const categoryTopics = CATEGORY_TOPIC_MAP[primaryCategory] ?? [];
  const topicNames = categoryTopics.map((topic) => topic.topic);
  const topicSet = new Set(subtopics.map((topic) => normalizeText(topic)));
  const related = topicNames.filter((topic) => !topicSet.has(normalizeText(topic)));
  return unique([primaryTopic, ...related]).slice(0, 6);
};

const scoreScores = (
  title: string,
  description: string,
  visibleText: string,
  note: string,
  reason: string,
  contentType: SmartLinkContentType,
  toolsMentioned: string[],
  frameworksMentioned: string[],
  keywords: string[]
): { usefulnessScore: number; actionabilityScore: number; learningValueScore: number } => {
  const text = normalizeText([title, description, visibleText, note, reason].join(' '));
  let usefulness = 28;
  let actionability = 22;
  let learningValue = 22;

  if (/(tutorial|how to|guide|step by step|walkthrough|checklist|template)/i.test(text)) {
    usefulness += 18;
    actionability += 20;
    learningValue += 16;
  }
  if (/(course|lesson|module|curriculum|curriculum)/i.test(text)) {
    usefulness += 10;
    learningValue += 22;
  }
  if (/(research|paper|study|analysis|method)/i.test(text)) {
    usefulness += 12;
    learningValue += 18;
  }
  if (/(tool|workflow|automation|template|framework)/i.test(text)) {
    actionability += 20;
    usefulness += 14;
  }
  if (toolsMentioned.length > 0) {
    usefulness += 8;
    actionability += 8;
  }
  if (frameworksMentioned.length > 0) {
    usefulness += 8;
    learningValue += 8;
  }
  if (keywords.length > 0) {
    usefulness += Math.min(14, keywords.length * 2);
    learningValue += Math.min(12, keywords.length * 2);
  }
  if (note.trim()) {
    usefulness += 6;
    actionability += 4;
  }
  if (reason.trim()) {
    usefulness += 4;
  }
  if (contentType === 'video' || contentType === 'reel') {
    usefulness += 6;
  }
  if (contentType === 'course' || contentType === 'research') {
    learningValue += 10;
  }

  return {
    usefulnessScore: clamp(Math.round(usefulness), 0, 100),
    actionabilityScore: clamp(Math.round(actionability), 0, 100),
    learningValueScore: clamp(Math.round(learningValue), 0, 100),
  };
};

const scoreSimilarity = (left: SmartLinkItem, right: SmartLinkItem): number => {
  if (left.normalizedUrl === right.normalizedUrl) {
    return 1;
  }

  const leftTokens = new Set(tokenize(left.searchIndex));
  const rightTokens = new Set(tokenize(right.searchIndex));
  const intersection = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size || 1;
  const overlap = intersection / union;

  const topicOverlap =
    normalizeText(left.primaryTopic) === normalizeText(right.primaryTopic) ? 1 : left.relatedTopics.some((topic) => normalizeText(topic) === normalizeText(right.primaryTopic)) ? 0.6 : 0;

  const tagOverlap = left.tags.filter((tag) => right.tags.some((other) => normalizeText(other) === normalizeText(tag))).length;
  const tagScore = clamp(tagOverlap / Math.max(Math.min(left.tags.length, right.tags.length), 1), 0, 1);
  const categoryScore = normalizeText(left.primaryCategory) === normalizeText(right.primaryCategory) ? 1 : 0.2;
  const contentTypeScore = left.contentType === right.contentType ? 1 : 0.2;

  const score = overlap * 0.45 + topicOverlap * 0.2 + tagScore * 0.15 + categoryScore * 0.1 + contentTypeScore * 0.1;
  return clamp(score, 0, 1);
};

const buildDuplicateMatch = (item: SmartLinkItem, match: SmartLinkItem, score: number): SmartLinkDuplicateMatch => ({
  itemId: match.id,
  title: match.title,
  url: match.url,
  score: Math.round(score * 100) / 100,
  exact: item.normalizedUrl === match.normalizedUrl,
  reason: item.normalizedUrl === match.normalizedUrl ? 'Exact URL match' : `Strong semantic overlap with ${match.primaryTopic}`,
});

export const detectDuplicateMatch = (item: SmartLinkItem, existingItems: SmartLinkItem[]): SmartLinkDuplicateMatch | null => {
  const matches = existingItems
    .filter((candidate) => candidate.id !== item.id)
    .map((candidate) => ({ candidate, score: scoreSimilarity(item, candidate) }))
    .sort((a, b) => b.score - a.score);

  const best = matches[0];
  if (!best) {
    return null;
  }

  if (best.score >= DEDUP_THRESHOLD) {
    return buildDuplicateMatch(item, best.candidate, best.score);
  }

  return null;
};

const buildSignalsText = (metadata: PageMetadata, fallbackUrl: string): SmartLinkContentSignals => ({
  pageTitle: isNonEmptyString(metadata.title) ? metadata.title.trim() : undefined,
  description: isNonEmptyString(metadata.description) ? metadata.description.trim() : undefined,
  visibleText: isNonEmptyString(metadata.text) ? metadata.text.trim().slice(0, 5000) : undefined,
  siteName: isNonEmptyString(metadata.siteName) ? metadata.siteName.trim() : undefined,
  author: isNonEmptyString(metadata.author) ? metadata.author.trim() : undefined,
  canonicalUrl: isNonEmptyString(metadata.canonicalUrl) ? metadata.canonicalUrl.trim() : fallbackUrl,
  ogType: isNonEmptyString(metadata.ogType) ? metadata.ogType.trim() : undefined,
  publishedAt: isNonEmptyString(metadata.publishedAt) ? metadata.publishedAt.trim() : undefined,
});

const buildFallbackMetadata = (url: string, platform: SmartLinkSourcePlatform, label: string): PageMetadata => {
  const parsed = new URL(url);
  const pathSegments = parsed.pathname.split('/').filter(Boolean).map((segment) => segment.replace(/[-_]+/g, ' '));
  const fallbackTitle =
    pathSegments
      .slice(-3)
      .map((segment) => titleCase(segment))
      .join(' ')
      .trim() || `${label} Link`;

  return {
    title: fallbackTitle,
    description: `Fallback metadata for a ${platform} link from ${label}.`,
    text: pathSegments.join(' '),
    url,
    siteName: label,
    author: undefined,
  } as PageMetadata;
};

const fetchPlatformMetadata = async (url: string, platform: SmartLinkSourcePlatform): Promise<PageMetadata> => {
  if (platform === 'youtube') {
    try {
      const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (response.ok) {
        const json = (await response.json()) as Record<string, unknown>;
        const title = isNonEmptyString(json.title) ? json.title : undefined;
        const author = isNonEmptyString(json.author_name) ? json.author_name : undefined;
        const thumbnail = isNonEmptyString(json.thumbnail_url) ? json.thumbnail_url : undefined;
        return {
          title: title ?? '',
          description: '',
          text: '',
          url,
          siteName: 'YouTube',
          author,
          image: thumbnail,
          canonicalUrl: url,
        } as PageMetadata;
      }
    } catch {
      // ignore and continue to generic metadata
    }
  }

  try {
    const metadata = await withTimeout(getPageMetadata(url), 9000, buildFallbackMetadata(url, platform, inferPlatform(url).label));
    return metadata;
  } catch {
    return buildFallbackMetadata(url, platform, inferPlatform(url).label);
  }
};

const inferUnknownFields = (signals: SmartLinkContentSignals, author: string, title: string): string[] => {
  const unknowns: string[] = [];
  if (!signals.pageTitle && !title) {
    unknowns.push('title');
  }
  if (!signals.description) {
    unknowns.push('description');
  }
  if (!signals.author && author === 'Unknown') {
    unknowns.push('author');
  }
  if (!signals.visibleText) {
    unknowns.push('visible-text');
  }
  return unknowns;
};

const buildAnalysisSnapshot = (
  baseText: string,
  input: SmartLinkSavedInput,
  platform: SmartLinkSourcePlatform,
  sourceLabel: string,
  contentType: SmartLinkContentType,
  category: string,
  categoryConfidence: number,
  customCategory: string | undefined,
  signals: SmartLinkContentSignals
): SmartLinkAnalysisSnapshot => {
  const combinedText = buildSearchIndex(baseText, input.note, input.reason, signals.pageTitle, signals.description, signals.visibleText, signals.author, signals.siteName);
  const topicResult = inferPrimaryTopic(combinedText, category);
  const primaryTopic = topicResult.topic || 'General';
  const subtopics = unique(
    [
      ...topicResult.matches.map((match) => match.topic),
      ...extractKeywords(combinedText, 5),
      ...(input.customTag ? [titleCase(input.customTag)] : []),
    ].filter(Boolean)
  ).slice(0, 6);
  const intentCategory = inferIntentCategory(combinedText, contentType);
  const difficultyLevel = inferDifficulty(combinedText);
  const toolsMentioned = inferToolsMentioned(combinedText);
  const frameworksMentioned = inferFrameworksMentioned(combinedText);
  const keywords = extractKeywords(combinedText, 6);
  const scores = scoreScores(
    signals.pageTitle ?? '',
    signals.description ?? '',
    signals.visibleText ?? '',
    input.note ?? '',
    input.reason ?? '',
    contentType,
    toolsMentioned,
    frameworksMentioned,
    keywords
  );
  const summary = getSummaryLead(contentType, sourceLabel, primaryTopic);
  const detailedSummary = buildDetailedSummary(signals, primaryTopic, intentCategory, difficultyLevel, input.note, input.reason);
  const importantPoints = buildImportantPoints(keywords, toolsMentioned, frameworksMentioned, contentType, primaryTopic);
  const actionSteps = buildActionableSteps(contentType, intentCategory, input.note);
  const relatedTopics = buildRelatedTopics(category, primaryTopic, subtopics);
  const tags = unique(
    [
      ...keywords,
      primaryTopic,
      titleCase(contentType),
      sourceLabel,
      ...(input.customTag ? [titleCase(input.customTag)] : []),
      ...(toolsMentioned.slice(0, 2) ?? []),
      ...(frameworksMentioned.slice(0, 2) ?? []),
    ]
      .filter(Boolean)
      .map((tag) => titleCase(tag))
  ).slice(0, 10);
  const searchIndex = buildSearchIndex(
    combinedText,
    tags.join(' '),
    actionSteps.join(' '),
    importantPoints.join(' '),
    relatedTopics.join(' '),
    category,
    input.customCategory,
    input.customTag
  );
  const unknownFields = inferUnknownFields(signals, signals.author ?? 'Unknown', signals.pageTitle ?? '');
  const analysisConfidence = clamp(
    Math.round((categoryConfidence + (signals.pageTitle ? 20 : 0) + (signals.description ? 16 : 0) + (signals.visibleText ? 18 : 0) + (signals.author ? 12 : 0)) / 2),
    10,
    100
  );
  return {
    title: signals.pageTitle ?? primaryTopic,
    sourcePlatform: platform,
    sourceLabel,
    contentType,
    author: signals.author ?? 'Unknown',
    summary,
    detailedSummary,
    primaryTopic,
    subtopics,
    intentCategory,
    difficultyLevel,
    usefulnessScore: scores.usefulnessScore,
    actionabilityScore: scores.actionabilityScore,
    learningValueScore: scores.learningValueScore,
    tags,
    importantPoints,
    toolsMentioned,
    frameworksMentioned,
    actionableSteps: actionSteps,
    relatedTopics,
    primaryCategory: category,
    secondaryCategories: unique([...relatedTopics.slice(0, 2), ...(input.customCategory ? [category] : [])]).filter(
      (topic) => normalizeText(topic) !== normalizeText(category)
    ),
    classificationConfidence: categoryConfidence,
    searchIndex,
    unknownFields,
    analysisConfidence,
  };
};

export const createSmartLinkDraft = (
  input: SmartLinkSavedInput,
  existingItems: SmartLinkItem[]
): SmartLinkItem => {
  const normalizedUrl = normalizeUrl(input.urlsText);
  const platformInfo = inferPlatform(normalizedUrl || input.urlsText);
  const fallbackTitle = input.customTag ? titleCase(input.customTag) : platformInfo.label;
  const parsedUrl = normalizedUrl || input.urlsText;
  const baseText = buildSearchIndex(parsedUrl, input.note, input.reason, input.customTag, input.customCategory);
  const categoryResult = inferCategory(baseText, input.customCategory);
  const contentType = inferContentType(platformInfo.platform, baseText, (() => {
    try {
      return new URL(parsedUrl).pathname;
    } catch {
      return '';
    }
  })());
  const signals: SmartLinkContentSignals = {
    pageTitle: fallbackTitle,
    description: input.reason || input.note || undefined,
    visibleText: undefined,
    siteName: platformInfo.label,
    author: 'Unknown',
    canonicalUrl: parsedUrl,
  };
  const snapshot = buildAnalysisSnapshot(
    baseText,
    input,
    platformInfo.platform,
    platformInfo.label,
    contentType,
    categoryResult.category,
    categoryResult.confidence,
    input.customCategory,
    signals
  );

  const draft: SmartLinkItem = {
    id: createId(),
    url: parsedUrl,
    normalizedUrl,
    ...snapshot,
    note: input.note,
    reason: input.reason,
    priority: input.priority ?? 'medium',
    revisitStatus: 'unread',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastOpenedAt: undefined,
    revisitCount: 0,
    analysisStatus: 'analyzing',
    analysisError: undefined,
    analysisSource: 'local',
    contentSignals: signals,
    duplicateSimilarityScore: 0,
    duplicateOf: undefined,
    duplicateDecision: 'pending',
    customTag: input.customTag,
    customCategory: input.customCategory,
    sourceOrigin: input.source ?? 'manual',
  };

  const duplicateMatch = detectDuplicateMatch(draft, existingItems);

  return {
    ...draft,
    duplicateSimilarityScore: duplicateMatch?.score ?? 0,
    duplicateOf: duplicateMatch?.itemId,
    duplicateDecision: duplicateMatch ? 'pending' : 'kept',
  };
};

export const analyzeSavedLinkSignals = async (
  url: string,
  platform: SmartLinkSourcePlatform
): Promise<SmartLinkContentSignals> => {
  const metadata = await fetchPlatformMetadata(url, platform);
  return buildSignalsText(metadata, url);
};

export const enrichSmartLinkItem = (
  item: SmartLinkItem,
  signals: SmartLinkContentSignals,
  existingItems: SmartLinkItem[]
): SmartLinkItem => {
  const rawText = buildSearchIndex(
    item.url,
    signals.pageTitle,
    signals.description,
    signals.visibleText,
    signals.siteName,
    signals.author,
    item.note,
    item.reason,
    item.customTag,
    item.customCategory,
    item.tags.join(' '),
    item.actionableSteps.join(' '),
    item.importantPoints.join(' ')
  );
  const categoryResult = inferCategory(rawText, item.customCategory);
  const contentType = inferContentType(item.sourcePlatform, rawText, (() => {
    try {
      return new URL(item.url).pathname;
    } catch {
      return '';
    }
  })());
  const topicResult = inferPrimaryTopic(rawText, categoryResult.category);
  const toolsMentioned = inferToolsMentioned(rawText);
  const frameworksMentioned = inferFrameworksMentioned(rawText);
  const keywords = extractKeywords(rawText, 6);
  const scores = scoreScores(
    signals.pageTitle ?? item.title,
    signals.description ?? '',
    signals.visibleText ?? '',
    item.note ?? '',
    item.reason ?? '',
    contentType,
    toolsMentioned,
    frameworksMentioned,
    keywords
  );
  const summary = getSummaryLead(contentType, signals.siteName ?? item.sourceLabel, topicResult.topic);
  const detailedSummary = buildDetailedSummary(signals, topicResult.topic, inferIntentCategory(rawText, contentType), inferDifficulty(rawText), item.note, item.reason);
  const importantPoints = buildImportantPoints(keywords, toolsMentioned, frameworksMentioned, contentType, topicResult.topic);
  const actionableSteps = buildActionableSteps(contentType, inferIntentCategory(rawText, contentType), item.note);
  const subtopics = unique([...topicResult.matches.map((match) => match.topic), ...keywords, ...(item.customTag ? [titleCase(item.customTag)] : [])]).slice(0, 6);
  const relatedTopics = buildRelatedTopics(categoryResult.category, topicResult.topic, subtopics);
  const tags = unique(
    [
      ...keywords,
      topicResult.topic,
      titleCase(contentType),
      signals.siteName || item.sourceLabel,
      ...(item.customTag ? [titleCase(item.customTag)] : []),
      ...toolsMentioned.slice(0, 2),
      ...frameworksMentioned.slice(0, 2),
    ]
      .filter(Boolean)
      .map((tag) => titleCase(tag))
  ).slice(0, 10);
  const searchIndex = buildSearchIndex(
    rawText,
    tags.join(' '),
    importantPoints.join(' '),
    actionableSteps.join(' '),
    relatedTopics.join(' '),
    item.sourceLabel,
    item.primaryCategory,
    item.customCategory
  );
  const duplicateMatch = detectDuplicateMatch(
    {
      ...item,
      title: signals.pageTitle ?? item.title,
      sourcePlatform: item.sourcePlatform,
      sourceLabel: signals.siteName ?? item.sourceLabel,
      contentType,
      author: signals.author ?? item.author,
      summary,
      detailedSummary,
      primaryTopic: topicResult.topic,
      subtopics,
      intentCategory: inferIntentCategory(rawText, contentType),
      difficultyLevel: inferDifficulty(rawText),
      usefulnessScore: scores.usefulnessScore,
      actionabilityScore: scores.actionabilityScore,
      learningValueScore: scores.learningValueScore,
      tags,
      importantPoints,
      toolsMentioned,
      frameworksMentioned,
      actionableSteps,
      relatedTopics,
      primaryCategory: categoryResult.category,
      secondaryCategories: unique([...relatedTopics.slice(0, 2), ...(item.customCategory ? [categoryResult.category] : [])]).filter(
        (topic) => normalizeText(topic) !== normalizeText(categoryResult.category)
      ),
      classificationConfidence: categoryResult.confidence,
      searchIndex,
      unknownFields: inferUnknownFields(signals, signals.author ?? item.author, signals.pageTitle ?? item.title),
      analysisConfidence: clamp(
        Math.round((categoryResult.confidence + (signals.pageTitle ? 20 : 0) + (signals.description ? 15 : 0) + (signals.visibleText ? 15 : 0)) / 2),
        10,
        100
      ),
      contentSignals: signals,
    },
    existingItems
  );

  return {
    ...item,
    title: signals.pageTitle ?? item.title,
    sourceLabel: signals.siteName ?? item.sourceLabel,
    contentType,
    author: signals.author ?? item.author,
    summary,
    detailedSummary,
    primaryTopic: topicResult.topic,
    subtopics,
    intentCategory: inferIntentCategory(rawText, contentType),
    difficultyLevel: inferDifficulty(rawText),
    usefulnessScore: scores.usefulnessScore,
    actionabilityScore: scores.actionabilityScore,
    learningValueScore: scores.learningValueScore,
    tags,
    importantPoints,
    toolsMentioned,
    frameworksMentioned,
    actionableSteps,
    relatedTopics,
    primaryCategory: categoryResult.category,
    secondaryCategories: unique([...relatedTopics.slice(0, 2), ...(item.customCategory ? [categoryResult.category] : [])]).filter(
      (topic) => normalizeText(topic) !== normalizeText(categoryResult.category)
    ),
    classificationConfidence: categoryResult.confidence,
    searchIndex,
    unknownFields: inferUnknownFields(signals, signals.author ?? item.author, signals.pageTitle ?? item.title),
    analysisConfidence: clamp(
      Math.round((categoryResult.confidence + (signals.pageTitle ? 20 : 0) + (signals.description ? 15 : 0) + (signals.visibleText ? 15 : 0)) / 2),
      10,
      100
    ),
    analysisStatus: 'ready',
    analysisError: undefined,
    analysisSource: 'local',
    contentSignals: signals,
    duplicateSimilarityScore: duplicateMatch?.score ?? item.duplicateSimilarityScore,
    duplicateOf: duplicateMatch?.itemId ?? item.duplicateOf,
    duplicateDecision: duplicateMatch ? 'pending' : item.duplicateDecision,
    updatedAt: nowIso(),
  };
};

export const buildSmartLinkItemFromInput = async (
  input: SmartLinkSavedInput,
  existingItems: SmartLinkItem[]
): Promise<SmartLinkItem> => {
  const draft = createSmartLinkDraft(input, existingItems);
  const signals = await analyzeSavedLinkSignals(draft.url, draft.sourcePlatform);
  return enrichSmartLinkItem(draft, signals, existingItems);
};

export const mergeSmartLinkRecords = (primary: SmartLinkItem, duplicate: SmartLinkItem): SmartLinkItem => {
  const mergedTags = unique([...primary.tags, ...duplicate.tags]).slice(0, 12);
  const mergedSubtopics = unique([...primary.subtopics, ...duplicate.subtopics]).slice(0, 8);
  const mergedImportantPoints = unique([...primary.importantPoints, ...duplicate.importantPoints]).slice(0, 8);
  const mergedActionSteps = unique([...primary.actionableSteps, ...duplicate.actionableSteps]).slice(0, 6);
  const mergedRelatedTopics = unique([...primary.relatedTopics, ...duplicate.relatedTopics]).slice(0, 8);
  const mergedTools = unique([...primary.toolsMentioned, ...duplicate.toolsMentioned]).slice(0, 8);
  const mergedFrameworks = unique([...primary.frameworksMentioned, ...duplicate.frameworksMentioned]).slice(0, 8);

  return {
    ...primary,
    tags: mergedTags,
    subtopics: mergedSubtopics,
    importantPoints: mergedImportantPoints,
    actionableSteps: mergedActionSteps,
    relatedTopics: mergedRelatedTopics,
    toolsMentioned: mergedTools,
    frameworksMentioned: mergedFrameworks,
    summary: primary.summary.length >= duplicate.summary.length ? primary.summary : duplicate.summary,
    detailedSummary: unique([...primary.detailedSummary, ...duplicate.detailedSummary]).slice(0, 6),
    usefulnessScore: Math.max(primary.usefulnessScore, duplicate.usefulnessScore),
    actionabilityScore: Math.max(primary.actionabilityScore, duplicate.actionabilityScore),
    learningValueScore: Math.max(primary.learningValueScore, duplicate.learningValueScore),
    duplicateSimilarityScore: Math.max(primary.duplicateSimilarityScore, duplicate.duplicateSimilarityScore),
    updatedAt: nowIso(),
  };
};

export const searchSmartLinks = (
  items: SmartLinkItem[],
  query: string,
  filters: SmartLinkQueryFilters = {}
): SmartLinkItem[] => {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenize(query);
  const categoryHint = SMART_LINK_DEFAULT_CATEGORIES.find((category) =>
    normalizeText(category).split(' ').every((part) => normalizedQuery.includes(part))
  );
  const difficultyHint = /(beginner|starter|basics|intro)/i.test(query)
    ? 'beginner'
    : /(advanced|expert|deep dive)/i.test(query)
      ? 'advanced'
      : /(intermediate|mid level)/i.test(query)
        ? 'intermediate'
        : undefined;
  const unusedHint = /(unused|never revisited|unread|ignored)/i.test(query);
  const importantHint = /(important|high value|high-value|priority)/i.test(query);
  const usefulnessHint = /(useful|valuable|best|important)/i.test(query) ? 75 : undefined;
  const expandedTokens = unique([
    ...queryTokens,
    ...queryTokens.flatMap((token) =>
      SYNONYM_GROUPS.find((group) => group.primary === token || group.aliases.includes(token))?.aliases ?? []
    ),
  ]);

  const filtered = items.filter((item) => {
    if (filters.category && normalizeText(filters.category) !== normalizeText(item.primaryCategory)) {
      return false;
    }
    if (filters.source && filters.source !== 'all' && filters.source !== item.sourcePlatform) {
      return false;
    }
    if (filters.status && filters.status !== 'all' && filters.status !== item.revisitStatus) {
      return false;
    }
    if (filters.difficulty && filters.difficulty !== 'all' && filters.difficulty !== item.difficultyLevel) {
      return false;
    }
    if (typeof filters.minUsefulness === 'number' && item.usefulnessScore < filters.minUsefulness) {
      return false;
    }
    if (filters.tag && !item.tags.some((tag) => normalizeText(tag) === normalizeText(filters.tag ?? ''))) {
      return false;
    }
    if (filters.onlyUnread && item.revisitStatus !== 'unread') {
      return false;
    }
    if (filters.onlyImportant && item.revisitStatus !== 'important') {
      return false;
    }
    if (filters.dateWindowDays && filters.dateWindowDays !== 'all') {
      const age = Date.now() - new Date(item.createdAt).getTime();
      if (age > filters.dateWindowDays * DAY_MS) {
        return false;
      }
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = normalizeText(
      [
        item.title,
        item.summary,
        item.primaryTopic,
        item.tags.join(' '),
        item.primaryCategory,
        item.sourceLabel,
        item.author,
        item.note,
        item.reason,
        item.actionableSteps.join(' '),
        item.relatedTopics.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
    );

    const exactMatch = haystack.includes(normalizedQuery);
    const tokenOverlap = expandedTokens.filter((token) => haystack.includes(normalizeText(token))).length;
    const categoryMatch =
      categoryHint && normalizeText(item.primaryCategory).includes(normalizeText(categoryHint))
        ? 1
        : item.relatedTopics.some((topic) => normalizeText(topic).includes(normalizedQuery))
          ? 0.5
          : 0;
    const relevanceScore =
      (exactMatch ? 5 : 0) +
      tokenOverlap * 1.5 +
      categoryMatch * 2 +
      (difficultyHint && item.difficultyLevel === difficultyHint ? 1.2 : 0) +
      (usefulnessHint && item.usefulnessScore >= usefulnessHint ? 1.2 : 0) +
      (unusedHint && item.revisitCount === 0 ? 1.2 : 0) +
      (importantHint && item.revisitStatus === 'important' ? 1.2 : 0);

    const semanticMatch = relevanceScore > 0 || item.searchIndex.includes(normalizedQuery);
    return semanticMatch;
  });

  return filtered
    .map((item) => {
      if (!normalizedQuery) {
        const recencyScore = 1 / (1 + (Date.now() - new Date(item.createdAt).getTime()) / DAY_MS);
        const priorityScore = item.priority === 'urgent' ? 1.4 : item.priority === 'high' ? 1.25 : item.priority === 'medium' ? 1.05 : 0.9;
        const revisitScore = item.revisitCount > 0 ? 1.1 : 0.95;
        return { item, score: item.usefulnessScore * 0.55 + item.actionabilityScore * 0.2 + recencyScore * 20 + priorityScore * 10 + revisitScore * 8 };
      }

      const haystack = normalizeText(
        [
          item.title,
          item.summary,
          item.primaryTopic,
          item.tags.join(' '),
          item.primaryCategory,
          item.sourceLabel,
          item.author,
          item.note,
          item.reason,
          item.actionableSteps.join(' '),
          item.relatedTopics.join(' '),
        ]
          .filter(Boolean)
          .join(' ')
      );
      const exactMatch = haystack.includes(normalizedQuery);
      const tokenOverlap = expandedTokens.filter((token) => haystack.includes(normalizeText(token))).length;
      const categoryScore = categoryHint && normalizeText(item.primaryCategory).includes(normalizeText(categoryHint)) ? 2 : 0;
      const score =
        (exactMatch ? 50 : 0) +
        tokenOverlap * 8 +
        categoryScore * 5 +
        (item.usefulnessScore / 4) +
        (item.revisitCount > 0 ? 4 : 0) +
        (item.revisitStatus === 'important' ? 6 : 0) +
        (item.priority === 'urgent' ? 4 : 0);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
};

const calculateCoverageStrength = (category: string, items: SmartLinkItem[]): { coverage: number; missing: string[] } => {
  const topicDefinitions = CATEGORY_TOPIC_MAP[category] ?? [];
  if (topicDefinitions.length === 0) {
    return { coverage: 0, missing: [] };
  }

  const coveredTopics = new Set(
    items.flatMap((item) => [item.primaryTopic, ...item.subtopics].map((topic) => normalizeText(topic)))
  );
  const expectedTopics = topicDefinitions.map((topic) => topic.topic);
  const missing = expectedTopics.filter((topic) => !coveredTopics.has(normalizeText(topic)));
  const coverage = clamp(Math.round(((expectedTopics.length - missing.length) / expectedTopics.length) * 100), 0, 100);
  return { coverage, missing };
};

const getTopThemes = (items: SmartLinkItem[]): string[] => {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    item.tags.slice(0, 4).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    item.primaryTopic && counts.set(item.primaryTopic, (counts.get(item.primaryTopic) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);
};

export const buildTopicClusters = (items: SmartLinkItem[]): SmartLinkClusterCard[] => {
  const grouped = items.reduce<Record<string, SmartLinkItem[]>>((acc, item) => {
    const category = item.primaryCategory || 'Miscellaneous';
    acc[category] = [...(acc[category] ?? []), item];
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([category, categoryItems]) => {
      const topicCount = categoryItems.reduce<Record<string, SmartLinkItem[]>>((acc, item) => {
        const topic = item.primaryTopic || 'General';
        acc[topic] = [...(acc[topic] ?? []), item];
        return acc;
      }, {});
      const topicBreakdown = Object.entries(topicCount)
        .map(([topic, topicItems]) => ({
          topic,
          count: topicItems.length,
          itemIds: topicItems.map((item) => item.id),
        }))
        .sort((a, b) => b.count - a.count);
      const representativeItems = [...categoryItems]
        .sort((a, b) => b.usefulnessScore + b.revisitCount * 5 - (a.usefulnessScore + a.revisitCount * 5))
        .slice(0, 3);
      const learningProgress = clamp(
        Math.round(
          (categoryItems.filter((item) => ['learned', 'completed'].includes(item.revisitStatus)).length / Math.max(categoryItems.length, 1)) * 100
        ),
        0,
        100
      );
      const { coverage, missing } = calculateCoverageStrength(category, categoryItems);
      const repeatedThemes = getTopThemes(categoryItems);
      return {
        category,
        itemCount: categoryItems.length,
        learningProgress,
        coverageStrength: coverage,
        missingSubtopics: missing.slice(0, 5),
        repeatedThemes,
        topicBreakdown,
        representativeItems,
        topTopics: topicBreakdown.slice(0, 4).map((entry) => entry.topic),
      };
    })
    .sort((a, b) => b.itemCount - a.itemCount || b.coverageStrength - a.coverageStrength);
};

const topicItemsForCategory = (items: SmartLinkItem[], category: string): Record<string, SmartLinkItem[]> => {
  return items
    .filter((item) => normalizeText(item.primaryCategory) === normalizeText(category))
    .reduce<Record<string, SmartLinkItem[]>>((acc, item) => {
      const topic = item.primaryTopic || 'General';
      acc[topic] = [...(acc[topic] ?? []), item];
      return acc;
    }, {});
};

const stageForTopics = (
  stageTopics: string[],
  allItems: SmartLinkItem[],
  category: string,
  topicMap: Record<string, SmartLinkItem[]>
): SmartLinkPathStage => {
  const stageItems = allItems.filter((item) =>
    stageTopics.some(
      (topic) =>
        normalizeText(item.primaryTopic).includes(normalizeText(topic)) ||
        item.subtopics.some((sub) => normalizeText(sub).includes(normalizeText(topic)))
    )
  );
  const practiceTasks = unique(
    stageTopics.flatMap((topic) => {
      const definition = (CATEGORY_TOPIC_MAP[category] ?? []).find((entry) => normalizeText(entry.topic) === normalizeText(topic));
      return definition?.practiceTasks ?? [`Practice ${topic.toLowerCase()} with one saved resource.`];
    })
  ).slice(0, 4);
  const miniProjects = unique(
    stageTopics.flatMap((topic) => {
      const definition = (CATEGORY_TOPIC_MAP[category] ?? []).find((entry) => normalizeText(entry.topic) === normalizeText(topic));
      return definition?.miniProjects ?? [`Build a small ${topic.toLowerCase()} project.`];
    })
  ).slice(0, 3);
  const description =
    stageItems.length > 0
      ? `Use ${stageItems.length} saved item${stageItems.length === 1 ? '' : 's'} to reinforce ${stageTopics.join(', ').toLowerCase()}.`
      : `Collect stronger resources for ${stageTopics.join(', ').toLowerCase()} and revisit the best examples.`;
  return {
    title: stageTopics.join(' + '),
    description,
    items: stageItems,
    practiceTasks,
    miniProjects,
  };
};

export const buildLearningPath = (
  items: SmartLinkItem[],
  selectedCategory?: string
): SmartLinkLearningPath | null => {
  const clusters = buildTopicClusters(items);
  const category = selectedCategory
    ? clusters.find((cluster) => normalizeText(cluster.category) === normalizeText(selectedCategory))?.category ?? selectedCategory
    : clusters[0]?.category;

  if (!category) {
    return null;
  }

  const categoryItems = items.filter((item) => normalizeText(item.primaryCategory) === normalizeText(category));
  const definitions = CATEGORY_TOPIC_MAP[category] ?? [];
  const topicMap = topicItemsForCategory(items, category);
  const coveredTopics = Object.keys(topicMap);
  const missingSubtopics = definitions.map((entry) => entry.topic).filter((topic) => !coveredTopics.some((covered) => normalizeText(covered) === normalizeText(topic)));
  const coverageStrength = definitions.length
    ? clamp(Math.round(((definitions.length - missingSubtopics.length) / definitions.length) * 100), 0, 100)
    : 0;
  const focusTopic =
    clusters.find((cluster) => cluster.category === category)?.topTopics[0] ??
    categoryItems[0]?.primaryTopic ??
    definitions[0]?.topic ??
    'General';
  const stageTopics = {
    beginner: definitions.slice(0, Math.max(2, Math.ceil(definitions.length / 3))).map((entry) => entry.topic),
    intermediate: definitions.slice(Math.max(2, Math.ceil(definitions.length / 3)), Math.max(4, Math.ceil((definitions.length * 2) / 3))).map((entry) => entry.topic),
    advanced: definitions.slice(Math.max(4, Math.ceil((definitions.length * 2) / 3))).map((entry) => entry.topic),
  };
  const beginner = stageForTopics(stageTopics.beginner.length > 0 ? stageTopics.beginner : [focusTopic], categoryItems, category, topicMap);
  const intermediate = stageForTopics(stageTopics.intermediate.length > 0 ? stageTopics.intermediate : [focusTopic], categoryItems, category, topicMap);
  const advanced = stageForTopics(stageTopics.advanced.length > 0 ? stageTopics.advanced : [focusTopic], categoryItems, category, topicMap);
  const nextSteps = unique(
    [
      missingSubtopics[0] ? `Cover ${missingSubtopics[0].toLowerCase()} next.` : `Deepen ${focusTopic.toLowerCase()} with one practice piece.`,
      categoryItems.some((item) => item.revisitCount === 0)
        ? 'Open your unused saved links and mark one as learned or important.'
        : 'Revisit one high-value link and capture a fresh note.',
      `Turn one ${category.toLowerCase()} resource into a mini project.`,
    ]
  );

  return {
    category,
    focusTopic,
    beginner,
    intermediate,
    advanced,
    nextSteps,
    missingSubtopics: missingSubtopics.slice(0, 6),
    coverageStrength,
  };
};

export const buildSmartLinkReminders = (items: SmartLinkItem[]): SmartLinkReminder[] => {
  const reminders: SmartLinkReminder[] = [];
  const sortedByPriority = [...items].sort((a, b) => {
    const priorityOrder: Record<SmartLinkPriority, number> = { urgent: 3, high: 2, medium: 1, low: 0 };
    return priorityOrder[b.priority] - priorityOrder[a.priority] || b.usefulnessScore - a.usefulnessScore;
  });

  sortedByPriority.forEach((item) => {
    const ageDays = (Date.now() - new Date(item.createdAt).getTime()) / DAY_MS;
    const lastOpenedDays = item.lastOpenedAt ? (Date.now() - new Date(item.lastOpenedAt).getTime()) / DAY_MS : Infinity;
    if (ageDays >= 7 && ageDays < 14 && item.revisitCount === 0) {
      reminders.push({
        id: `${item.id}-7days`,
        itemId: item.id,
        kind: 'saved-7-days-ago',
        title: `${item.title} is 7+ days old`,
        description: 'A small revisit can turn this saved link into usable knowledge.',
        dueLabel: `${Math.floor(ageDays)} days ago`,
        actionLabel: 'Revisit now',
        priority: item.priority,
      });
    }
    if (item.revisitCount === 0 && ageDays >= 3) {
      reminders.push({
        id: `${item.id}-never`,
        itemId: item.id,
        kind: 'never-revisited',
        title: `${item.title} has not been revisited yet`,
        description: 'This is a good candidate for your revisit queue.',
        dueLabel: 'Never revisited',
        actionLabel: 'Open and mark learned',
        priority: item.priority,
      });
    }
    if (item.usefulnessScore >= 80 && item.revisitCount === 0) {
      reminders.push({
        id: `${item.id}-value`,
        itemId: item.id,
        kind: 'high-value-unused',
        title: `${item.title} looks high value but unused`,
        description: 'High-value content should be surfaced before it disappears in the archive.',
        dueLabel: 'High value',
        actionLabel: 'Use it now',
        priority: 'high',
      });
    }
    if (item.priority === 'urgent' || item.priority === 'high') {
      reminders.push({
        id: `${item.id}-gem`,
        itemId: item.id,
        kind: 'daily-gem',
        title: `Daily gem: ${item.title}`,
        description: 'This link deserves a quick refresh because it is high priority.',
        dueLabel: lastOpenedDays === Infinity ? 'Not opened yet' : `${Math.round(lastOpenedDays)} days since open`,
        actionLabel: 'Revisit today',
        priority: item.priority,
      });
    }
    if (item.revisitCount > 0 && lastOpenedDays >= 14) {
      reminders.push({
        id: `${item.id}-queue`,
        itemId: item.id,
        kind: 'revisit-queue',
        title: `Revisit queue: ${item.title}`,
        description: 'It has been a while since the last revisit.',
        dueLabel: `${Math.round(lastOpenedDays)} days since open`,
        actionLabel: 'Refresh knowledge',
        priority: item.priority,
      });
    }
  });

  if (items.length > 0) {
    const weeklyItems = items
      .filter((item) => (Date.now() - new Date(item.createdAt).getTime()) / DAY_MS <= 7)
      .sort((a, b) => b.usefulnessScore - a.usefulnessScore)
      .slice(0, 3);
    if (weeklyItems.length > 0) {
      reminders.unshift({
        id: 'weekly-digest',
        itemId: weeklyItems[0].id,
        kind: 'weekly-digest',
        title: 'Weekly digest is ready',
        description: `${weeklyItems.length} fresh save${weeklyItems.length === 1 ? '' : 's'} are worth revisiting.`,
        dueLabel: 'This week',
        actionLabel: 'Review digest',
        priority: 'medium',
      });
    }
  }

  return reminders.slice(0, 12);
};

export const buildSmartLinkAnalytics = (items: SmartLinkItem[]): SmartLinkAnalytics => {
  const byCategory = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.primaryCategory] = (acc[item.primaryCategory] ?? 0) + 1;
    return acc;
  }, {});

  const topicCount = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.primaryTopic] = (acc[item.primaryTopic] ?? 0) + 1;
    return acc;
  }, {});

  const revisitCount = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.primaryTopic] = (acc[item.primaryTopic] ?? 0) + item.revisitCount;
    return acc;
  }, {});

  const ignoredCount = items.reduce<Record<string, number>>((acc, item) => {
    if (item.revisitStatus === 'ignored') {
      acc[item.primaryTopic] = (acc[item.primaryTopic] ?? 0) + 1;
    }
    return acc;
  }, {});

  const mostSavedTopic = Object.entries(topicCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';
  const mostRevisitedTopic = Object.entries(revisitCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';
  const mostIgnoredTopic = Object.entries(ignoredCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';
  const learningProgress = clamp(
    Math.round((items.filter((item) => ['learned', 'completed'].includes(item.revisitStatus)).length / Math.max(items.length, 1)) * 100),
    0,
    100
  );
  const unusedContentCount = items.filter((item) => item.revisitCount === 0 && (Date.now() - new Date(item.createdAt).getTime()) / DAY_MS >= 7).length;
  const highValueContentCount = items.filter((item) => item.usefulnessScore >= 80).length;
  const averageUsefulness = items.length ? Math.round(items.reduce((sum, item) => sum + item.usefulnessScore, 0) / items.length) : 0;
  const averageActionability = items.length ? Math.round(items.reduce((sum, item) => sum + item.actionabilityScore, 0) / items.length) : 0;
  const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const start = date.getTime();
    const end = start + DAY_MS;
    const count = items.filter((item) => {
      const createdAt = new Date(item.createdAt).getTime();
      return createdAt >= start && createdAt < end;
    }).length;
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      count,
    };
  });
  const knowledgeGaps = unique(
    buildTopicClusters(items)
      .flatMap((cluster) => cluster.missingSubtopics.slice(0, 2))
      .filter(Boolean)
  ).slice(0, 6);

  return {
    totalSaved: items.length,
    byCategory,
    mostSavedTopic,
    mostRevisitedTopic,
    mostIgnoredTopic,
    learningProgress,
    knowledgeGaps,
    weeklyActivity,
    unusedContentCount,
    highValueContentCount,
    averageUsefulness,
    averageActionability,
  };
};

export const answerSmartLinkQuestion = (query: string, items: SmartLinkItem[]): SmartLinkAssistantAnswer => {
  const normalized = normalizeText(query);
  const relatedItems = searchSmartLinks(items, query).slice(0, 5);
  const topCategory = buildTopicClusters(items)[0]?.category;
  const topItem = relatedItems[0];

  if (!query.trim()) {
    return {
      answer: 'Ask me what you have saved, what to learn next, or which links are most useful for beginners.',
      highlights: ['Try questions like: "What do I know about transitions?"', '"What should I learn next?"', '"Show AI tools for students".'],
      relatedItems: [],
      nextStep: 'Start with a topic, category, or a beginner question.',
      confidence: 18,
    };
  }

  if (/(what should i learn next|next step|what next|where should i go)/i.test(normalized)) {
    const path = buildLearningPath(items, topCategory);
    return {
      answer: path
        ? `Based on your saved links, the strongest next move is to cover ${path.missingSubtopics[0] ?? path.focusTopic}.`
        : 'I do not have enough saved links yet to propose a strong next step.',
      highlights: path
        ? [
            `Focus topic: ${path.focusTopic}.`,
            `Coverage strength: ${path.coverageStrength}%.`,
            ...path.nextSteps.slice(0, 2),
          ]
        : ['Add a few more links in one topic cluster to unlock a stronger path.'],
      relatedItems,
      nextStep: path?.nextSteps[0] ?? 'Save more links and ask again.',
      confidence: path ? 82 : 26,
    };
  }

  if (/(summarize|summary|overview)/i.test(normalized)) {
    const topicCounts = buildTopicClusters(items);
    const targetCategory = topicCounts.find((cluster) => normalizeText(cluster.category).includes(normalized.split(' ')[0] ?? ''))?.category || topCategory;
    const targetItems = targetCategory ? items.filter((item) => normalizeText(item.primaryCategory) === normalizeText(targetCategory)) : relatedItems;
    return {
      answer: targetItems.length
        ? `You have ${targetItems.length} saved item${targetItems.length === 1 ? '' : 's'} in ${targetCategory ?? 'your saved knowledge'}. The dominant theme is ${targetItems[0]?.primaryTopic ?? 'unknown'}.`
        : 'I could not find enough matching links to summarize that topic.',
      highlights: targetItems.slice(0, 3).map((item) => `${item.title} - ${item.summary}`),
      relatedItems: targetItems.slice(0, 5),
      nextStep: targetItems[0]?.actionableSteps[0] ?? 'Open one saved link and capture a one-line takeaway.',
      confidence: targetItems.length > 0 ? 84 : 28,
    };
  }

  if (/(beginners|beginner|starter|easy)/i.test(normalized)) {
    const beginnerLinks = searchSmartLinks(items, query, { difficulty: 'beginner' }).slice(0, 5);
    return {
      answer: beginnerLinks.length
        ? `I found ${beginnerLinks.length} beginner-friendly saved link${beginnerLinks.length === 1 ? '' : 's'} that can help you start quickly.`
        : 'I do not have many clear beginner-level links yet, so a broader search will work better.',
      highlights: beginnerLinks.slice(0, 3).map((item) => `${item.title} - ${item.primaryTopic}`),
      relatedItems: beginnerLinks,
      nextStep: beginnerLinks[0]?.actionableSteps[0] ?? 'Save a few beginner resources to create a stronger learning path.',
      confidence: beginnerLinks.length > 0 ? 80 : 32,
    };
  }

  if (/(related|similar|find me|show me links|search)/i.test(normalized)) {
    return {
      answer: relatedItems.length
        ? `I found ${relatedItems.length} relevant link${relatedItems.length === 1 ? '' : 's'} in your saved knowledge.`
        : 'I could not find a strong match, but I can still help if you try a broader topic.',
      highlights: relatedItems.slice(0, 3).map((item) => `${item.title} - ${item.primaryCategory}`),
      relatedItems,
      nextStep: relatedItems[0]?.actionableSteps[0] ?? 'Try a different keyword or ask about a wider topic.',
      confidence: relatedItems.length > 0 ? 76 : 28,
    };
  }

  const topicClusters = buildTopicClusters(items);
  const targetCluster = topicClusters.find((cluster) => normalizeText(cluster.category).includes(normalized)) ?? topicClusters[0];
  if (!targetCluster) {
    return {
      answer: 'I need a few saved links before I can answer that confidently.',
      highlights: ['Save a link first so the assistant can learn your library.'],
      relatedItems: [],
      nextStep: 'Save a link and ask again.',
      confidence: 16,
    };
  }

  return {
    answer: `From your saved knowledge, ${targetCluster.category} is your strongest cluster so far, with ${targetCluster.itemCount} saved item${targetCluster.itemCount === 1 ? '' : 's'}.`,
    highlights: [
      `Top topic: ${targetCluster.topTopics[0] ?? 'General'}.`,
      targetCluster.missingSubtopics[0] ? `Missing subtopic: ${targetCluster.missingSubtopics[0]}.` : 'The cluster is fairly well covered.',
      targetCluster.repeatedThemes[0] ? `Repeated theme: ${targetCluster.repeatedThemes[0]}.` : 'No repeated theme detected yet.',
    ],
    relatedItems,
    nextStep: topItem?.actionableSteps[0] ?? `Revisit one ${targetCluster.category.toLowerCase()} link and turn it into a mini task.`,
    confidence: 62,
  };
};

export const createSmartLinkHubState = (items: SmartLinkItem[] = []): SmartLinkHubState => ({
  items,
  analysisCache: {},
  customCategories: [],
});

export const hydrateSmartLinkHubState = (raw: unknown): SmartLinkHubState => {
  if (!raw || typeof raw !== 'object') {
    return createSmartLinkHubState();
  }

  const data = raw as Partial<SmartLinkHubState>;
  const items = Array.isArray(data.items) ? (data.items as SmartLinkItem[]) : [];
  const analysisCache = data.analysisCache && typeof data.analysisCache === 'object' ? data.analysisCache : {};
  const customCategories = Array.isArray(data.customCategories)
    ? data.customCategories.filter(isNonEmptyString).map((value) => normalizeWhitespace(value))
    : [];

  return {
    items,
    analysisCache: analysisCache as Record<string, SmartLinkAnalysisCacheEntry>,
    customCategories: unique(customCategories),
  };
};

export const persistSmartLinkCacheEntry = (
  state: SmartLinkHubState,
  item: SmartLinkItem,
  signals: SmartLinkContentSignals
): SmartLinkHubState => ({
  ...state,
  analysisCache: {
    ...state.analysisCache,
    [item.normalizedUrl]: {
      updatedAt: nowIso(),
      snapshot: {
        title: item.title,
        sourcePlatform: item.sourcePlatform,
        sourceLabel: item.sourceLabel,
        contentType: item.contentType,
        author: item.author,
        summary: item.summary,
        detailedSummary: item.detailedSummary,
        primaryTopic: item.primaryTopic,
        subtopics: item.subtopics,
        intentCategory: item.intentCategory,
        difficultyLevel: item.difficultyLevel,
        usefulnessScore: item.usefulnessScore,
        actionabilityScore: item.actionabilityScore,
        learningValueScore: item.learningValueScore,
        tags: item.tags,
        importantPoints: item.importantPoints,
        toolsMentioned: item.toolsMentioned,
        frameworksMentioned: item.frameworksMentioned,
        actionableSteps: item.actionableSteps,
        relatedTopics: item.relatedTopics,
        primaryCategory: item.primaryCategory,
        secondaryCategories: item.secondaryCategories,
        classificationConfidence: item.classificationConfidence,
        searchIndex: item.searchIndex,
        unknownFields: item.unknownFields,
        analysisConfidence: item.analysisConfidence,
      },
      signals,
    },
  },
});

export const applyCachedAnalysis = (
  item: SmartLinkItem,
  cacheEntry: SmartLinkAnalysisCacheEntry
): SmartLinkItem => ({
  ...item,
  ...cacheEntry.snapshot,
  contentSignals: cacheEntry.signals,
  analysisStatus: 'ready',
  analysisSource: 'cache',
  updatedAt: nowIso(),
});

export const isValidHttpUrl = (rawUrl: string): boolean => {
  try {
    const normalized = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const url = new URL(normalized);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const buildBatchResult = (items: SmartLinkItem[]): SmartLinkBatchResult => ({
  saved: items,
  duplicates: [],
  invalidInputs: [],
});
