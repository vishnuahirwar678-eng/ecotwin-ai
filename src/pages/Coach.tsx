import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { validateCoachMessageInsert } from '../utils/validation';
import {
  computeCategoryTotals, computeTotalKg, calculateSustainabilityScore,
  AVG_MONTHLY_KG,
} from '../utils/emissions';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '../lib/emissions';
import type { CoachMessage, CarbonCategory, CarbonEntry } from '../types';
import Spinner from '../components/ui/Spinner';
import { Send, Bot, User, Sparkles, Leaf, AlertCircle } from 'lucide-react';

interface CoachContext {
  categoryTotals: Record<string, number>;
  totalKg: number;
  monthlyEstimate: number;
  score: ReturnType<typeof calculateSustainabilityScore>;
  topCategory: CarbonCategory | null;
}

function buildContext(entries: CarbonEntry[]): CoachContext {
  const totals = computeCategoryTotals(entries, ALL_CATEGORIES);
  const totalKg = computeTotalKg(entries);
  const uniqueDays = new Set(entries.map(e => e.date)).size;
  const avgDaily = uniqueDays > 0 ? totalKg / uniqueDays : 0;
  const monthlyEstimate = avgDaily * 30;
  const score = calculateSustainabilityScore(monthlyEstimate);
  const topCat = (Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) as CarbonCategory | null;
  return { categoryTotals: totals, totalKg, monthlyEstimate, score, topCategory: topCat };
}

const RESPONSES: Record<string, (ctx: CoachContext) => string[]> = {
  transport: (ctx) => {
    const t = ctx.categoryTotals.transport ?? 0;
    const pct = ctx.totalKg > 0 ? ((t / ctx.totalKg) * 100).toFixed(0) : '0';
    return [
      `Your transport emissions are ${t.toFixed(1)} kg (${pct}% of your total). Here are targeted reductions:\n\n- Switch 2 weekly car trips to public transit: save ~${(t * 0.15).toFixed(1)} kg/month\n- Carpool 3 days/week: save ~${(t * 0.2).toFixed(1)} kg/month\n- Walk/bike trips under 3 km: save ~${(t * 0.1).toFixed(1)} kg/month\n- Switch to EV: save ~${(t * 0.75).toFixed(1)} kg/month`,
      `Transport is often the #1 emission source. Your ${t.toFixed(1)} kg is ${t > 50 ? 'above' : 'below'} average. The most impactful single change? If you commute by car, switching to an EV or public transit could cut this by 60-75%.`,
    ];
  },
  energy: (ctx) => {
    const e = ctx.categoryTotals.energy ?? 0;
    return [
      `Your energy emissions: ${e.toFixed(1)} kg. Smart reduction strategies:\n\n- Switch to a green energy provider: save ~${(e * 0.8).toFixed(1)} kg/month\n- Install smart thermostat: save ~${(e * 0.15).toFixed(1)} kg/month\n- Replace all bulbs with LED: save ~${(e * 0.08).toFixed(1)} kg/month\n- Air-dry laundry: save ~${(e * 0.1).toFixed(1)} kg/month`,
    ];
  },
  food: (ctx) => {
    const f = ctx.categoryTotals.food ?? 0;
    return [
      `Your food emissions: ${f.toFixed(1)} kg. Dietary changes with the highest impact:\n\n- 3 meatless days/week: save ~${(f * 0.25).toFixed(1)} kg/month\n- Replace beef with poultry: save ~${(f * 0.4).toFixed(1)} kg/month per meal swapped\n- Go vegetarian: save ~${(f * 0.45).toFixed(1)} kg/month\n- Go vegan: save ~${(f * 0.65).toFixed(1)} kg/month`,
    ];
  },
  shopping: (ctx) => {
    const s = ctx.categoryTotals.shopping ?? 0;
    return [
      `Your shopping emissions: ${s.toFixed(1)} kg. Conscious consumption tips:\n\n- Buy 50% second-hand: save ~${(s * 0.3).toFixed(1)} kg/month\n- Extend electronics lifespan 1 extra year: save ~${(s * 0.2).toFixed(1)} kg/month\n- Apply the 30-day rule before purchases: reduce impulse buying ~40%`,
    ];
  },
  goal: (ctx) => {
    const goalKg = 150;
    const remaining = Math.max(0, goalKg - ctx.totalKg);
    return [
      `Your sustainability score is ${ctx.score.rating} (${ctx.score.label}). Monthly estimate: ${ctx.monthlyEstimate.toFixed(0)} kg vs goal of ${goalKg} kg.\n\n${ctx.monthlyEstimate <= goalKg ? 'Great news! You are on track with your monthly goal. Keep it up!' : `You need to reduce ${remaining.toFixed(0)} kg to hit your goal. Focus on your biggest category: ${ctx.topCategory ? CATEGORY_LABELS[ctx.topCategory] : 'any category'}.`}`,
    ];
  },
  help: () => [
    'I can help you with:\n\n- Transport: car alternatives, EV savings, flight impact\n- Energy: green providers, smart thermostats, LED savings\n- Food: dietary changes, food waste, local sourcing\n- Shopping: second-hand, repair culture, mindful consumption\n- Goals: monthly targets, progress tracking, sustainability score\n\nJust ask about any topic!',
  ],
  default: (ctx) => [
    `Based on your data (${ctx.totalKg.toFixed(1)} kg tracked, score: ${ctx.score.rating}), here are my top recommendations:\n\n1. Focus on ${ctx.topCategory ? CATEGORY_LABELS[ctx.topCategory] : 'your biggest category'} — it's your largest emission source\n2. Set a monthly goal of 150 kg CO2 (well below US avg of ${AVG_MONTHLY_KG.us} kg)\n3. Start with one small change and build consistency\n\nWhat area would you like specific advice on?`,
  ],
};

function classifyInput(input: string): string {
  const lower = input.toLowerCase();
  if (/transport|car|drive|commut|bus|train|bike|cycl|flight|fly|ev|electric.?car/i.test(lower)) return 'transport';
  if (/energy|electric|power|heat|cool|air.?con|thermostat|bulb|light|solar/i.test(lower)) return 'energy';
  if (/food|meat|veget|vegan|diet|meal|cook|waste|grocer|beef|chicken/i.test(lower)) return 'food';
  if (/shop|buy|cloth|fashion|electronic|purchas|second.?hand|fast.?fash/i.test(lower)) return 'shopping';
  if (/goal|target|reduce|plan|start|begin|month|score|rating/i.test(lower)) return 'goal';
  if (/help|what can|how|advice|recommend/i.test(lower)) return 'help';
  return 'default';
}

const SUGGESTED_QUESTIONS = [
  'How can I reduce my transport emissions?',
  'What are easy food swaps to cut CO2?',
  'Help me set a monthly reduction goal',
  'Tips for sustainable shopping?',
  'How can I save energy at home?',
] as const;

export default function Coach() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [context, setContext] = useState<CoachContext>({
    categoryTotals: {}, totalKg: 0, monthlyEstimate: 0,
    score: calculateSustainabilityScore(0), topCategory: null,
  });
  const [coachError, setCoachError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) {
      setHistoryLoading(false);
      return;
    }
    const loadHistory = supabase
      .from('coach_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    const loadEntries = supabase
      .from('carbon_entries')
      .select('*')
      .eq('user_id', user.id);

    Promise.all([loadHistory, loadEntries]).then(([msgRes, entryRes]) => {
      if (msgRes.data) setMessages(msgRes.data as CoachMessage[]);
      if (entryRes.data) setContext(buildContext(entryRes.data as CarbonEntry[]));
      setHistoryLoading(false);
    });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !user || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);
    setCoachError(null);

    const category = classifyInput(userMsg);
    const responses = RESPONSES[category]?.(context) ?? RESPONSES.default(context);
    const aiResponse = responses[Math.floor(Math.random() * responses.length)];

    const optimisticUser: CoachMessage = {
      id: `temp-u-${Date.now()}`,
      user_id: user.id,
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString(),
    };
    const optimisticAI: CoachMessage = {
      id: `temp-a-${Date.now()}`,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticUser, optimisticAI]);

    if (supabase) {
      const rows = [
        { user_id: user.id, role: 'user' as const, content: userMsg },
        { user_id: user.id, role: 'assistant' as const, content: aiResponse },
      ];
      for (const row of rows) {
        const result = validateCoachMessageInsert(row);
        if (!result.success) {
          setCoachError(result.error.issues.map((e: { message: string }) => e.message).join(', '));
          setSending(false);
          return;
        }
      }
      await supabase.from('coach_messages').insert(rows);
    }

    setSending(false);
  }, [input, user, sending, context]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  if (historyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 flex flex-col">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 flex flex-col flex-1">
        <header className="py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl eco-gradient flex items-center justify-center" aria-hidden="true">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Sustainability Coach</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your personal guide to a lower carbon footprint</p>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4" role="log" aria-label="Chat messages" aria-live="polite">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl eco-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-eco-500/25" aria-hidden="true">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to your AI Coach!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Ask me anything about reducing your carbon footprint. I can help with transport, energy, food, shopping, and goal-setting.
              </p>
              <ul className="grid gap-2 max-w-md mx-auto">
                {SUGGESTED_QUESTIONS.map(q => (
                  <li key={q}>
                    <button
                      onClick={() => setInput(q)}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-slate-700 dark:text-slate-300 text-left hover:border-eco-300 dark:hover:border-eco-600 hover:text-eco-600 dark:hover:text-eco-400 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500"
                    >
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg eco-gradient flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-eco-500 text-white rounded-br-md'
                    : 'bg-white dark:bg-gray-900 text-slate-700 dark:text-slate-300 border border-gray-100 dark:border-gray-800 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3" aria-label="AI is thinking" role="status">
              <div className="w-8 h-8 rounded-lg eco-gradient flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-eco-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-eco-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-eco-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {coachError && (
          <div className="flex items-center gap-2 p-3 mb-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{coachError}</span>
          </div>
        )}

        {/* Input */}
        <footer className="py-4 border-t border-gray-200 dark:border-gray-800">
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
            className="flex gap-3"
          >
            <label htmlFor="coach-input" className="sr-only">Ask your sustainability coach</label>
            <input
              id="coach-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your sustainability coach..."
              className="input-field flex-1"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="btn-primary !px-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 focus-visible:ring-offset-2"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
