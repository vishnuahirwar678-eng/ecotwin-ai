import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Leaf, BarChart3, Calculator, MessageCircle, FlaskConical,
  ArrowRight, TrendingDown, Zap, Globe, Shield, ChevronRight,
} from 'lucide-react';

const features = [
  {
    icon: Calculator,
    title: 'Carbon Calculator',
    description: 'Track your daily carbon footprint across transport, energy, food, and shopping with precision.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: BarChart3,
    title: 'Smart Dashboard',
    description: 'Visualize your emissions with interactive charts and track progress toward your goals.',
    color: 'from-cyan-500 to-blue-600',
  },
  {
    icon: MessageCircle,
    title: 'AI Sustainability Coach',
    description: 'Get personalized recommendations from your AI-powered sustainability advisor.',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: FlaskConical,
    title: 'What-If Simulator',
    description: 'Explore how lifestyle changes impact your carbon footprint before making them.',
    color: 'from-rose-500 to-pink-600',
  },
];

const stats = [
  { value: '2.5M+', label: 'Kg CO2 Tracked', icon: TrendingDown },
  { value: '15K+', label: 'Active Users', icon: Globe },
  { value: '87%', label: 'Reduced Footprint', icon: Zap },
  { value: '4.9', label: 'User Rating', icon: Shield },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-eco-50 via-emerald-50 to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-eco-950" />
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-eco-400 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-400 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-300 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-eco-100 dark:bg-eco-900/40 text-eco-700 dark:text-eco-300 text-sm font-medium mb-8 animate-fade-in">
              <Leaf className="w-4 h-4" />
              AI-Powered Carbon Footprint Awareness
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up">
              <span className="text-gray-900 dark:text-white">Know Your</span>
              <br />
              <span className="eco-gradient-text">Carbon Twin</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              EcoTwin AI helps you understand, track, and reduce your carbon footprint with
              intelligent insights and personalized recommendations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {user ? (
                <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-lg">
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn-primary flex items-center gap-2 text-lg">
                    Get Started Free <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link to="/login" className="btn-secondary flex items-center gap-2 text-lg">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Floating earth illustration */}
          <div className="mt-16 flex justify-center animate-float">
            <div className="relative w-48 h-48 sm:w-64 sm:h-64">
              <div className="absolute inset-0 rounded-full eco-gradient opacity-20 animate-pulse-slow" />
              <div className="absolute inset-4 rounded-full eco-gradient opacity-40" />
              <div className="absolute inset-8 rounded-full eco-gradient flex items-center justify-center shadow-2xl shadow-eco-500/30">
                <Leaf className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center group">
                <div className="w-12 h-12 rounded-xl bg-eco-50 dark:bg-eco-900/30 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-eco-600 dark:text-eco-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold eco-gradient-text">{value}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Go Green
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powerful tools to help you understand and reduce your environmental impact.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group relative p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 card-hover"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
                <ChevronRight className="absolute top-8 right-8 w-5 h-5 text-gray-300 dark:text-gray-700 group-hover:text-eco-500 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 eco-gradient opacity-5 dark:opacity-10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Reduce Your Carbon Footprint?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Join thousands of users who are making a difference. Start tracking your impact today.
          </p>
          {user ? (
            <Link to="/dashboard" className="btn-primary text-lg inline-flex items-center gap-2">
              Open Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link to="/signup" className="btn-primary text-lg inline-flex items-center gap-2">
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 dark:bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg eco-gradient flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">EcoTwin AI</span>
            </div>
            <p className="text-sm text-gray-500">
              Built with care for the planet. &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
