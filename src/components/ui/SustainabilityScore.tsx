import type { SustainabilityScore as ScoreType } from '../../types';

interface SustainabilityScoreProps {
  score: ScoreType;
  size?: 'sm' | 'md' | 'lg';
}

export default function SustainabilityScore({ score, size = 'md' }: SustainabilityScoreProps) {
  const sizeClasses = size === 'sm'
    ? { ring: 'w-20 h-20', text: 'text-2xl', label: 'text-xs' }
    : size === 'lg'
    ? { ring: 'w-32 h-32', text: 'text-4xl', label: 'text-sm' }
    : { ring: 'w-24 h-24', text: 'text-3xl', label: 'text-xs' };

  const circumference = 2 * Math.PI * 36;
  const progress = (score.percentage / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center gap-2" aria-label={`Sustainability score: ${score.rating}, ${score.label}`}>
      <div className={`${sizeClasses.ring} relative`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
          <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-gray-700" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={score.color}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${sizeClasses.text} font-bold`} style={{ color: score.color }}>
            {score.rating}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className={`${sizeClasses.label} font-semibold text-gray-900 dark:text-white`}>{score.label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(score.percentage)}% sustainability</p>
      </div>
    </div>
  );
}
