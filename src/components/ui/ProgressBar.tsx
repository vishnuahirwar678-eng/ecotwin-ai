interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'warning' | 'danger';
}

export default function ProgressBar({ value, max, label, showValue = true, size = 'md', variant = 'default' }: ProgressBarProps) {
  const percent = Math.min(100, (value / max) * 100);
  const heightClass = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-6' : 'h-4';

  const barColor = variant === 'danger'
    ? 'bg-gradient-to-r from-red-500 to-rose-500'
    : variant === 'warning'
    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
    : 'eco-gradient';

  return (
    <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      {showValue && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {value.toFixed(1)} / {max} kg CO2
          </span>
        </div>
      )}
      <div className={`${heightClass} bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
