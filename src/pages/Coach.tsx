import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Send, Bot, User, Sparkles, Leaf } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const AI_RESPONSES: Record<string, string[]> = {
  default: [
    "That's a great question! Reducing your carbon footprint starts with small, consistent changes. Try focusing on one category at a time — like transport or food — and build from there.",
    "I'd recommend starting with your biggest emission category. Even a 10% reduction there will have more impact than a 50% cut in a smaller one.",
    "Remember: progress over perfection. Every kilogram of CO2 you save matters. Let's look at some specific actions you can take today.",
  ],
  transport: [
    "Transport is often the largest contributor to carbon footprints. Consider these swaps: Car → Public transit saves ~60%, Car → Bicycle saves ~100%, Gas car → EV saves ~75%. Even carpooling 2 days a week can cut your transport emissions by 20%.",
    "For daily commutes under 5km, walking or cycling isn't just eco-friendly — it's also great for your health. You could save around 500 kg CO2 per year just from this change!",
    "If you must drive, maintain proper tire pressure and remove excess weight. This alone can improve fuel efficiency by 3-5%, saving ~100 kg CO2 annually.",
  ],
  energy: [
    "Energy emissions can be dramatically reduced: Switch to a green energy provider (saves ~80%), Use smart thermostats (saves ~15%), LED bulbs (saves ~75% on lighting). Also, unplugging devices when not in use can save 5-10% on your electricity bill.",
    "Heating and cooling are the biggest energy consumers. A programmable thermostat that lowers temperature by 2°C when you're sleeping can save about 300 kg CO2 per year.",
    "Consider these quick wins: Wash clothes in cold water (saves ~90% of washing energy), Air dry when possible, Run appliances during off-peak hours. These small changes add up!",
  ],
  food: [
    "Food choices have a massive impact! Here's the CO2 per meal: Beef ~6.6kg, Pork ~3.8kg, Chicken ~2.5kg, Vegetarian ~1.2kg, Vegan ~0.6kg. Going meatless just 3 days a week can save ~400 kg CO2/year.",
    "Reducing food waste is one of the most effective actions: Plan meals ahead, Store food properly, Use leftovers creatively. Food waste accounts for ~8% of global emissions — that's more than aviation!",
    "Buy local and seasonal produce. Imported out-of-season food can have 5-10x the carbon footprint of local alternatives. Farmers markets are your friend!",
  ],
  shopping: [
    "The fashion industry produces 10% of global emissions. Key strategies: Buy second-hand (saves ~85% vs new), Choose quality over quantity (fewer, longer-lasting items), Repair instead of replace, Swap clothes with friends.",
    "Before any purchase, ask: Do I need this? Can I borrow or rent it? Can I buy it second-hand? This 'pause principle' can reduce shopping emissions by 50%.",
    "Electronics have huge embodied carbon. Keep devices longer, buy refurbished, and recycle properly. A new smartphone represents about 70 kg CO2 — keeping it 3 years instead of 2 cuts its annual impact by 33%.",
  ],
  goal: [
    "Setting achievable goals is key! I recommend: Start with a 10% reduction target for the first month, Track daily to build awareness, Focus on your biggest emission category first, Celebrate small wins — they compound! The average person can reduce their footprint by 20-30% with simple lifestyle changes.",
    "Your monthly goal of 150 kg is ambitious but achievable! Here's a realistic path: Cut 2 car trips per week (~8 kg/month), Replace 3 meat meals with vegetarian (~16 kg/month), Switch to LED lighting (~9 kg/month), That's already 33 kg saved!",
  ],
  help: [
    "I can help you with: Understanding your carbon footprint, Finding reduction strategies for each category, Setting realistic goals, Comparing the impact of different lifestyle changes, Staying motivated on your sustainability journey. Just ask about any topic — transport, energy, food, shopping, or goal-setting!",
  ],
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  let category = 'default';

  if (/transport|car|drive|commut|bus|train|bike|cycl|flight|fly/i.test(lower)) category = 'transport';
  else if (/energy|electric|power|heat|cool|air.?con|thermostat|bulb|light/i.test(lower)) category = 'energy';
  else if (/food|meat|veget|vegan|diet|meal|cook|waste|grocer/i.test(lower)) category = 'food';
  else if (/shop|buy|cloth|fashion|electronic|purchas|second.?hand/i.test(lower)) category = 'shopping';
  else if (/goal|target|reduce|plan|start|begin|month/i.test(lower)) category = 'goal';
  else if (/help|what can|how/i.test(lower)) category = 'help';

  const responses = AI_RESPONSES[category];
  return responses[Math.floor(Math.random() * responses.length)];
}

export default function Coach() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('coach_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as Message[]);
        setHistoryLoading(false);
      });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    const aiResponse = getAIResponse(userMsg);

    const optimisticUser: Message = {
      id: `temp-u-${Date.now()}`,
      role: 'user',
      content: userMsg,
      created_at: new Date().toISOString(),
    };
    const optimisticAI: Message = {
      id: `temp-a-${Date.now()}`,
      role: 'assistant',
      content: aiResponse,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticUser, optimisticAI]);

    await supabase.from('coach_messages').insert([
      { user_id: user.id, role: 'user', content: userMsg },
      { user_id: user.id, role: 'assistant', content: aiResponse },
    ]);

    setLoading(false);
  };

  const suggestedQuestions = [
    'How can I reduce my transport emissions?',
    'What are easy food swaps to cut CO2?',
    'Help me set a monthly reduction goal',
    'Tips for sustainable shopping?',
    'How can I save energy at home?',
  ];

  if (historyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full eco-gradient animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20 flex flex-col">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 flex flex-col flex-1">
        <div className="py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl eco-gradient flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Sustainability Coach</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your personal guide to a lower carbon footprint</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl eco-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-eco-500/25">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to your AI Coach!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Ask me anything about reducing your carbon footprint. I can help with transport, energy, food, shopping, and goal-setting.
              </p>
              <div className="grid gap-2 max-w-md mx-auto">
                {suggestedQuestions.map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 text-left hover:border-eco-300 dark:hover:border-eco-600 hover:text-eco-600 dark:hover:text-eco-400 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg eco-gradient flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-eco-500 text-white rounded-br-md'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg eco-gradient flex items-center justify-center flex-shrink-0">
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

        {/* Input */}
        <div className="py-4 border-t border-gray-200 dark:border-gray-800">
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask your sustainability coach..."
              className="input-field flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="btn-primary !px-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
