import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Copy, Download, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { generateFastText } from '../services/geminiService';
import ErrorMessage from '../components/ErrorMessage';
import { useLocale } from '../hooks/useLocale';

type ToolId =
  | 'resume-cover-letter'
  | 'proposal-writer'
  | 'invoice-quotation'
  | 'contract-generator'
  | 'portfolio-builder'
  | 'thumbnail-hook-generator'
  | 'seo-blog-toolkit'
  | 'social-calendar'
  | 'meeting-action-items'
  | 'email-assistant'
  | 'pricing-calculator'
  | 'file-converter'
  | 'code-bug-finder'
  | 'interview-prep-bot'
  | 'habit-sprint-tracker';

type ToolMode = 'ai' | 'invoice' | 'contract' | 'pricing' | 'converter' | 'tracker';

interface ToolMeta {
  id: ToolId;
  title: string;
  subtitle: string;
  mode: ToolMode;
}

interface SprintTask {
  id: string;
  text: string;
  done: boolean;
}

const TOOL_META: Record<ToolId, ToolMeta> = {
  'resume-cover-letter': {
    id: 'resume-cover-letter',
    title: 'Resume + Cover Letter AI',
    subtitle: 'Role-based ATS-friendly resume aur cover letter ready kare.',
    mode: 'ai',
  },
  'proposal-writer': {
    id: 'proposal-writer',
    title: 'Proposal Writer',
    subtitle: 'Upwork/Fiverr style winning proposal draft kare.',
    mode: 'ai',
  },
  'invoice-quotation': {
    id: 'invoice-quotation',
    title: 'Invoice + Quotation Generator',
    subtitle: 'Line-items ke saath professional invoice banaye.',
    mode: 'invoice',
  },
  'contract-generator': {
    id: 'contract-generator',
    title: 'Contract Generator',
    subtitle: 'Freelance agreement ka clean draft turant banaye.',
    mode: 'contract',
  },
  'portfolio-builder': {
    id: 'portfolio-builder',
    title: 'Portfolio Builder',
    subtitle: 'Projects ko case-study format me convert kare.',
    mode: 'ai',
  },
  'thumbnail-hook-generator': {
    id: 'thumbnail-hook-generator',
    title: 'Thumbnail + Hook Generator',
    subtitle: 'High-CTR thumbnail text aur 3-sec hooks generate kare.',
    mode: 'ai',
  },
  'seo-blog-toolkit': {
    id: 'seo-blog-toolkit',
    title: 'SEO Blog Toolkit',
    subtitle: 'Keyword clusters, outline, meta tags aur FAQs generate kare.',
    mode: 'ai',
  },
  'social-calendar': {
    id: 'social-calendar',
    title: 'Social Content Calendar',
    subtitle: '30-day content plan with captions and CTA.',
    mode: 'ai',
  },
  'meeting-action-items': {
    id: 'meeting-action-items',
    title: 'Meeting Notes to Action Items',
    subtitle: 'Raw notes ko tasks, owners, deadline me convert kare.',
    mode: 'ai',
  },
  'email-assistant': {
    id: 'email-assistant',
    title: 'Email Assistant',
    subtitle: 'Client emails, follow-ups, reminders smartly draft kare.',
    mode: 'ai',
  },
  'pricing-calculator': {
    id: 'pricing-calculator',
    title: 'Pricing Calculator',
    subtitle: 'Hourly + project rate estimate nikale.',
    mode: 'pricing',
  },
  'file-converter': {
    id: 'file-converter',
    title: 'File Converter Toolkit',
    subtitle: 'Image format conversion (PNG/JPEG/WEBP) with quality control.',
    mode: 'converter',
  },
  'code-bug-finder': {
    id: 'code-bug-finder',
    title: 'Code Bug Finder + Refactor',
    subtitle: 'Code issues detect kare aur cleaner refactor suggest kare.',
    mode: 'ai',
  },
  'interview-prep-bot': {
    id: 'interview-prep-bot',
    title: 'Interview Prep Bot',
    subtitle: 'Role based mock questions aur improvement plan de.',
    mode: 'ai',
  },
  'habit-sprint-tracker': {
    id: 'habit-sprint-tracker',
    title: 'Habit / Study Sprint Tracker',
    subtitle: 'Daily sprint tasks track karo with streak feel.',
    mode: 'tracker',
  },
};

const getInitialFields = (toolId: ToolId): Record<string, string> => {
  switch (toolId) {
    case 'resume-cover-letter':
      return {
        role: 'Frontend Developer',
        experience: '2 years',
        skills: 'React, TypeScript, Tailwind, Firebase',
        achievements: 'Built 20+ landing pages, improved conversion by 35%',
      };
    case 'proposal-writer':
      return {
        platform: 'Upwork',
        service: 'Web design and development',
        budget: '$300',
        timeline: '7 days',
        clientBrief: 'Need modern landing page for my coaching business.',
      };
    case 'portfolio-builder':
      return {
        niche: 'Web Development',
        audience: 'Startup founders and coaches',
        projects:
          '1) SaaS landing page redesign | Result: +28% leads\n2) Portfolio website | Result: faster load speed\n3) E-commerce UI revamp | Result: better UX',
      };
    case 'thumbnail-hook-generator':
      return {
        platform: 'YouTube',
        topic: 'How to get freelance clients',
        audience: 'Beginner freelancers',
      };
    case 'seo-blog-toolkit':
      return {
        niche: 'Freelancing',
        keyword: 'how to get clients online',
        country: 'India',
      };
    case 'social-calendar':
      return {
        niche: 'Graphic Design',
        platforms: 'Instagram, LinkedIn, YouTube Shorts',
        days: '30',
      };
    case 'meeting-action-items':
      return {
        notes:
          'Client wants new homepage. Need hero revamp, testimonials section, faster mobile speed. Deadline next Friday. Nishant handles design, Arvind handles development.',
      };
    case 'email-assistant':
      return {
        emailType: 'Follow-up',
        tone: 'Professional + friendly',
        context: 'Client did not reply on proposal sent 3 days ago.',
      };
    case 'code-bug-finder':
      return {
        issue: 'Component rerenders too much and app feels laggy.',
        code: 'useEffect(() => { setData(fetchData()); });',
      };
    case 'interview-prep-bot':
      return {
        role: 'Frontend Developer',
        level: 'Junior to Mid',
        background: 'React projects, basic DSA, Firebase experience',
      };
    case 'invoice-quotation':
      return {
        freelancer: 'Editor Nishant',
        client: 'ABC Pvt Ltd',
        invoiceNo: 'INV-2026-001',
        dueDate: '2026-03-20',
        items: 'Landing Page Design|1|15000\nReact Development|1|25000',
        taxRate: '18',
      };
    case 'contract-generator':
      return {
        freelancer: 'Editor Nishant',
        client: 'ABC Pvt Ltd',
        service: 'Website design and development',
        fee: '40000',
        startDate: '2026-03-10',
        timeline: '21 days',
        revisions: '2',
      };
    case 'pricing-calculator':
      return {
        monthlyTarget: '100000',
        monthlyExpenses: '35000',
        hoursPerWeek: '30',
        level: 'mid',
      };
    default:
      return {};
  }
};

const parseCurrency = (value: string): number => {
  const cleaned = Number.parseFloat((value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(cleaned) ? cleaned : 0;
};

const inr = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  );

const ProToolsPage: React.FC = () => {
  const { toolId } = useParams<{ toolId: ToolId }>();
  const { t } = useLocale();

  const meta = useMemo(() => {
    if (!toolId) {
      return null;
    }
    return TOOL_META[toolId as ToolId] || null;
  }, [toolId]);

  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [convertFile, setConvertFile] = useState<File | null>(null);
  const [convertFormat, setConvertFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [convertQuality, setConvertQuality] = useState(0.92);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);

  const trackerStorageKey = `sprint_tasks_${toolId || 'default'}`;
  const [tasks, setTasks] = useState<SprintTask[]>([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    if (!meta) {
      return;
    }
    setFields(getInitialFields(meta.id));
    setResult('');
    setError(null);
    setConvertedUrl(null);
  }, [meta]);

  useEffect(() => {
    if (meta?.mode !== 'tracker') {
      return;
    }
    try {
      const raw = localStorage.getItem(trackerStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setTasks(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setTasks([]);
  }, [meta, trackerStorageKey]);

  useEffect(() => {
    if (meta?.mode !== 'tracker') {
      return;
    }
    try {
      localStorage.setItem(trackerStorageKey, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [meta, tasks, trackerStorageKey]);

  if (!meta) {
    return <Navigate to="/" replace />;
  }

  const updateField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const runAiPrompt = async (prompt: string) => {
    setLoading(true);
    setError(null);
    setResult('');
    try {
      const stream = await generateFastText(prompt);
      let out = '';
      for await (const chunk of stream as AsyncIterable<{ text?: string }>) {
        const text = chunk?.text ?? '';
        if (text) {
          out += text;
          setResult(out);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'AI response aane me issue aaya.');
    } finally {
      setLoading(false);
    }
  };

  const buildAiPrompt = (): string => {
    switch (meta.id) {
      case 'resume-cover-letter':
        return `You are a senior career coach. Write in Hinglish.
Role: ${fields.role}
Experience: ${fields.experience}
Skills: ${fields.skills}
Achievements: ${fields.achievements}
Return:
1) ATS-friendly resume summary
2) 10 bullet points for experience section
3) Skills section
4) Cover letter (short and personalized)
5) Improvement tips`;
      case 'proposal-writer':
        return `You are a freelance proposal expert. Write in Hinglish.
Platform: ${fields.platform}
Service: ${fields.service}
Budget: ${fields.budget}
Timeline: ${fields.timeline}
Client Brief: ${fields.clientBrief}
Generate:
1) Winning proposal
2) Short version
3) 3 follow-up messages
4) Value-based pricing explanation`;
      case 'portfolio-builder':
        return `Create a portfolio structure in Hinglish.
Niche: ${fields.niche}
Target audience: ${fields.audience}
Projects: ${fields.projects}
Generate:
1) Portfolio homepage copy
2) 3 detailed case study templates
3) About section
4) CTA section
5) Improvement checklist`;
      case 'thumbnail-hook-generator':
        return `Create high CTR ideas in Hinglish.
Platform: ${fields.platform}
Topic: ${fields.topic}
Audience: ${fields.audience}
Generate:
1) 25 thumbnail text ideas
2) 20 hook lines for first 3 seconds
3) 10 title variants
4) do/dont list`;
      case 'seo-blog-toolkit':
        return `Create SEO toolkit in Hinglish.
Niche: ${fields.niche}
Primary keyword: ${fields.keyword}
Country: ${fields.country}
Generate:
1) Keyword clusters
2) Search intent mapping
3) Blog outline
4) Meta title/description options
5) FAQ schema in JSON-LD`;
      case 'social-calendar':
        return `Create social content calendar in Hinglish.
Niche: ${fields.niche}
Platforms: ${fields.platforms}
Days: ${fields.days}
Generate:
1) Day-wise calendar table
2) Post format and caption for each day
3) CTA and hashtag suggestions
4) Repurposing plan`;
      case 'meeting-action-items':
        return `Convert notes into structured output in Hinglish.
Meeting notes:
${fields.notes}
Return:
1) concise summary
2) action items table (task, owner, priority, deadline)
3) risks/blockers
4) next meeting agenda`;
      case 'email-assistant':
        return `Write professional client emails in Hinglish.
Email type: ${fields.emailType}
Tone: ${fields.tone}
Context: ${fields.context}
Generate:
1) primary email
2) shorter variant
3) firm payment reminder version
4) follow-up sequence (3 messages)`;
      case 'code-bug-finder':
        return `You are a senior software engineer. Reply in Hinglish with code blocks.
Issue: ${fields.issue}
Code:
${fields.code}
Return:
1) probable root causes
2) fixed version
3) optimized version
4) test checklist
5) performance tips`;
      case 'interview-prep-bot':
        return `Act as interview coach in Hinglish.
Role: ${fields.role}
Level: ${fields.level}
Background: ${fields.background}
Generate:
1) 30 interview questions
2) ideal concise answers
3) 5 mock rounds with scoring rubric
4) 7-day prep plan`;
      default:
        return '';
    }
  };

  const handleInvoiceGenerate = () => {
    const lines = (fields.items || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [desc, qtyRaw, rateRaw] = line.split('|').map((s) => (s || '').trim());
        const qty = Number.parseFloat(qtyRaw || '1') || 1;
        const rate = parseCurrency(rateRaw || '0');
        return { desc: desc || 'Service', qty, rate, amount: qty * rate };
      });

    const subtotal = lines.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = Number.parseFloat(fields.taxRate || '0') || 0;
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;

    const rowText = lines
      .map((item, idx) => `${idx + 1}. ${item.desc} | Qty: ${item.qty} | Rate: ${inr(item.rate)} | Amount: ${inr(item.amount)}`)
      .join('\n');

    setResult(`INVOICE / QUOTATION
Freelancer: ${fields.freelancer}
Client: ${fields.client}
Invoice No: ${fields.invoiceNo}
Due Date: ${fields.dueDate}

Items:
${rowText || 'No items'}

Subtotal: ${inr(subtotal)}
Tax (${taxRate}%): ${inr(tax)}
Total: ${inr(total)}

Payment Terms:
- 50% advance, 50% on delivery
- Late payment fee: 2% per week`);
  };

  const handleContractGenerate = () => {
    setResult(`FREELANCE SERVICE AGREEMENT (Draft)

This Agreement is between ${fields.freelancer} ("Freelancer") and ${fields.client} ("Client").

1. Services:
${fields.service}

2. Project Start Date:
${fields.startDate}

3. Timeline:
${fields.timeline}

4. Fees:
Total project fee: ${inr(parseCurrency(fields.fee))}
Payment terms: 50% upfront, 50% before final handover.

5. Revisions:
Up to ${fields.revisions} revision rounds are included. Extra revisions are billable.

6. Ownership:
Final approved work ownership transfers to Client after full payment.

7. Cancellation:
Advance payment is non-refundable after project kick-off.

8. Confidentiality:
Both parties will keep business information confidential.

9. Signatures:
Freelancer: ____________________
Client: ____________________`);
  };

  const handlePricingCalculate = () => {
    const monthlyTarget = parseCurrency(fields.monthlyTarget || '0');
    const expenses = parseCurrency(fields.monthlyExpenses || '0');
    const hoursPerWeek = Number.parseFloat(fields.hoursPerWeek || '0') || 0;
    const billableHoursPerMonth = hoursPerWeek * 4 * 0.7;
    const level = fields.level || 'mid';

    const baseHourly = billableHoursPerMonth > 0 ? (monthlyTarget + expenses) / billableHoursPerMonth : 0;
    const multiplier = level === 'beginner' ? 0.85 : level === 'senior' ? 1.35 : 1;
    const suggestedHourly = baseHourly * multiplier;
    const dayRate = suggestedHourly * 6;
    const starterProject = suggestedHourly * 8;
    const standardProject = suggestedHourly * 20;
    const premiumProject = suggestedHourly * 40;

    setResult(`PRICING ESTIMATE
Monthly Target: ${inr(monthlyTarget)}
Monthly Expenses: ${inr(expenses)}
Hours/Week: ${hoursPerWeek}
Billable Hours/Month: ${billableHoursPerMonth.toFixed(1)}
Level: ${level}

Suggested Hourly Rate: ${inr(suggestedHourly)}
Suggested Day Rate (6h): ${inr(dayRate)}

Package Suggestions:
- Starter (about 8 hours): ${inr(starterProject)}
- Standard (about 20 hours): ${inr(standardProject)}
- Premium (about 40 hours): ${inr(premiumProject)}

Tip:
Always add 20-30% buffer for revisions, calls, and project management.`);
  };

  const handleConvert = async () => {
    if (!convertFile) {
      setError('Pehle image file upload karo.');
      return;
    }
    if (!convertFile.type.startsWith('image/')) {
      setError('Abhi sirf image conversion supported hai.');
      return;
    }

    setError(null);
    setLoading(true);
    setConvertedUrl(null);

    try {
      const inputUrl = URL.createObjectURL(convertFile);
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setLoading(false);
          setError('Canvas context available nahi hai.');
          URL.revokeObjectURL(inputUrl);
          return;
        }

        ctx.drawImage(image, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(inputUrl);
            if (!blob) {
              setLoading(false);
              setError('Conversion fail ho gaya. Doosri image try karo.');
              return;
            }

            const outUrl = URL.createObjectURL(blob);
            setConvertedUrl(outUrl);
            setResult(`Converted successfully.
Format: ${convertFormat}
Size: ${(blob.size / 1024).toFixed(1)} KB`);
            setLoading(false);
          },
          convertFormat,
          convertQuality
        );
      };
      image.onerror = () => {
        URL.revokeObjectURL(inputUrl);
        setLoading(false);
        setError('Image load nahi ho paayi.');
      };
      image.src = inputUrl;
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || 'Conversion me issue aaya.');
    }
  };

  const addTask = () => {
    const text = newTask.trim();
    if (!text) {
      return;
    }
    setTasks((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, text, done: false }]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const completed = tasks.filter((task) => task.done).length;

  const renderTextInput = (key: string, label: string, placeholder?: string) => (
    <div>
      <label className="mb-2 block text-sm font-semibold text-brand-text-secondary">{label}</label>
      <input
        value={fields[key] || ''}
        onChange={(e) => updateField(key, e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-3 text-brand-text outline-none focus:border-brand-accent/40"
      />
    </div>
  );

  const renderTextArea = (key: string, label: string, rows = 5, placeholder?: string) => (
    <div>
      <label className="mb-2 block text-sm font-semibold text-brand-text-secondary">{label}</label>
      <textarea
        value={fields[key] || ''}
        onChange={(e) => updateField(key, e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-3 text-brand-text outline-none focus:border-brand-accent/40"
      />
    </div>
  );

  const handleMainAction = async () => {
    if (meta.mode === 'ai') {
      const prompt = buildAiPrompt();
      if (!prompt.trim()) {
        setError('Required details missing hain.');
        return;
      }
      await runAiPrompt(prompt);
      return;
    }

    setError(null);
    if (meta.mode === 'invoice') {
      handleInvoiceGenerate();
    } else if (meta.mode === 'contract') {
      handleContractGenerate();
    } else if (meta.mode === 'pricing') {
      handlePricingCalculate();
    } else if (meta.mode === 'converter') {
      await handleConvert();
    }
  };

  return (
    <div className="container mx-auto max-w-4xl animate-fadeIn space-y-6">
      <Link to="/" className="inline-block text-brand-accent hover:underline">
        &larr; {t('common.backTools')}
      </Link>

      <div className="ios-card space-y-5 p-6 md:p-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-brand-text md:text-4xl">{meta.title}</h1>
          <p className="mt-2 text-brand-text-secondary">{meta.subtitle}</p>
        </div>

        {meta.mode === 'ai' && (
          <div className="grid grid-cols-1 gap-4">
            {meta.id === 'resume-cover-letter' && (
              <>
                {renderTextInput('role', 'Target Role')}
                {renderTextInput('experience', 'Experience')}
                {renderTextInput('skills', 'Skills')}
                {renderTextArea('achievements', 'Achievements', 3)}
              </>
            )}

            {meta.id === 'proposal-writer' && (
              <>
                {renderTextInput('platform', 'Platform')}
                {renderTextInput('service', 'Service')}
                {renderTextInput('budget', 'Budget')}
                {renderTextInput('timeline', 'Timeline')}
                {renderTextArea('clientBrief', 'Client Brief', 5)}
              </>
            )}

            {meta.id === 'portfolio-builder' && (
              <>
                {renderTextInput('niche', 'Niche')}
                {renderTextInput('audience', 'Target Audience')}
                {renderTextArea('projects', 'Projects & Results', 6)}
              </>
            )}

            {meta.id === 'thumbnail-hook-generator' && (
              <>
                {renderTextInput('platform', 'Platform')}
                {renderTextInput('topic', 'Topic')}
                {renderTextInput('audience', 'Audience')}
              </>
            )}

            {meta.id === 'seo-blog-toolkit' && (
              <>
                {renderTextInput('niche', 'Niche')}
                {renderTextInput('keyword', 'Primary Keyword')}
                {renderTextInput('country', 'Target Country')}
              </>
            )}

            {meta.id === 'social-calendar' && (
              <>
                {renderTextInput('niche', 'Niche')}
                {renderTextInput('platforms', 'Platforms')}
                {renderTextInput('days', 'How many days')}
              </>
            )}

            {meta.id === 'meeting-action-items' && <>{renderTextArea('notes', 'Meeting Notes', 8)}</>}

            {meta.id === 'email-assistant' && (
              <>
                {renderTextInput('emailType', 'Email Type')}
                {renderTextInput('tone', 'Tone')}
                {renderTextArea('context', 'Context', 6)}
              </>
            )}

            {meta.id === 'code-bug-finder' && (
              <>
                {renderTextInput('issue', 'Issue Summary')}
                {renderTextArea('code', 'Code Snippet', 8)}
              </>
            )}

            {meta.id === 'interview-prep-bot' && (
              <>
                {renderTextInput('role', 'Role')}
                {renderTextInput('level', 'Level')}
                {renderTextArea('background', 'Background', 5)}
              </>
            )}
          </div>
        )}

        {meta.mode === 'invoice' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderTextInput('freelancer', 'Freelancer Name')}
            {renderTextInput('client', 'Client Name')}
            {renderTextInput('invoiceNo', 'Invoice Number')}
            {renderTextInput('dueDate', 'Due Date (YYYY-MM-DD)')}
            <div className="md:col-span-2">{renderTextArea('items', 'Items (Description|Qty|Rate each line)', 6)}</div>
            {renderTextInput('taxRate', 'Tax Rate %')}
          </div>
        )}

        {meta.mode === 'contract' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderTextInput('freelancer', 'Freelancer Name')}
            {renderTextInput('client', 'Client Name')}
            {renderTextInput('service', 'Service Scope')}
            {renderTextInput('fee', 'Project Fee (INR)')}
            {renderTextInput('startDate', 'Start Date (YYYY-MM-DD)')}
            {renderTextInput('timeline', 'Timeline')}
            {renderTextInput('revisions', 'Included Revisions')}
          </div>
        )}

        {meta.mode === 'pricing' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {renderTextInput('monthlyTarget', 'Monthly Income Target (INR)')}
            {renderTextInput('monthlyExpenses', 'Monthly Expenses (INR)')}
            {renderTextInput('hoursPerWeek', 'Working Hours Per Week')}
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-text-secondary">Experience Level</label>
              <select
                value={fields.level || 'mid'}
                onChange={(e) => updateField('level', e.target.value)}
                className="w-full rounded-xl border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-3 text-brand-text outline-none focus:border-brand-accent/40"
              >
                <option value="beginner">Beginner</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
              </select>
            </div>
          </div>
        )}

        {meta.mode === 'converter' && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-brand-text-secondary">Select Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setConvertFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-brand-text-secondary file:mr-4 file:rounded-full file:border-0 file:bg-brand-accent file:px-4 file:py-2 file:font-semibold file:text-white"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-text-secondary">Output Format</label>
                <select
                  value={convertFormat}
                  onChange={(e) => setConvertFormat(e.target.value as 'image/png' | 'image/jpeg' | 'image/webp')}
                  className="w-full rounded-xl border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-3 text-brand-text outline-none"
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/webp">WEBP</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-brand-text-secondary">Quality ({convertQuality.toFixed(2)})</label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.01}
                  value={convertQuality}
                  onChange={(e) => setConvertQuality(Number.parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            {convertedUrl && (
              <a
                href={convertedUrl}
                download={`converted-${Date.now()}${convertFormat === 'image/png' ? '.png' : convertFormat === 'image/webp' ? '.webp' : '.jpg'}`}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white"
              >
                <Download size={18} />
                Download Converted File
              </a>
            )}
          </div>
        )}

        {meta.mode === 'tracker' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Aaj ka sprint task likho..."
                className="w-full rounded-xl border border-brand-text-secondary/20 bg-brand-primary/50 px-4 py-3 text-brand-text outline-none"
              />
              <button
                onClick={addTask}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-accent px-4 py-3 font-semibold text-white"
              >
                <Plus size={18} />
                Add
              </button>
            </div>
            <div className="rounded-xl border border-brand-text-secondary/10 bg-brand-primary/40 p-4 text-sm text-brand-text-secondary">
              Progress: {completed}/{tasks.length} tasks complete
            </div>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-xl bg-brand-primary/50 px-4 py-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                    <span className={task.done ? 'line-through text-brand-text-secondary' : 'text-brand-text'}>{task.text}</span>
                  </label>
                  <button onClick={() => deleteTask(task.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm text-brand-text-secondary">Abhi koi task nahi. Pehla sprint add karo.</p>}
            </div>
          </div>
        )}

        {meta.mode !== 'tracker' && (
          <button
            onClick={() => {
              void handleMainAction();
            }}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-accent px-6 py-3 font-semibold text-white transition hover:bg-brand-accent-light disabled:opacity-60"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : null}
            {loading ? 'Processing...' : meta.mode === 'ai' ? 'Generate' : 'Run Tool'}
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={() => void handleMainAction()} />}

      {(result || loading) && meta.mode !== 'tracker' && (
        <div className="ios-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black text-brand-text">Result</h2>
            {result && (
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-3 py-2 text-sm font-semibold text-brand-text"
              >
                <Copy size={16} />
                Copy
              </button>
            )}
          </div>
          <pre className="max-h-[540px] overflow-auto whitespace-pre-wrap rounded-xl bg-brand-primary/60 p-4 text-sm text-brand-text-secondary">
            {loading && !result ? 'Generating output...' : result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ProToolsPage;
