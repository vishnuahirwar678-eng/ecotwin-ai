import type { CarbonCategory } from '../../types';
import { CATEGORY_CONFIG, CATEGORY_LABELS } from '../../lib/emissions';

interface CategoryTabProps {
  category: CarbonCategory;
  isActive: boolean;
  onClick: () => void;
}

export default function CategoryTab({ category, isActive, onClick }: CategoryTabProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      aria-label={`${CATEGORY_LABELS[category]} category`}
      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
        isActive
          ? 'border-eco-500 bg-eco-50 dark:bg-eco-900/20 shadow-lg shadow-eco-500/10'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`} aria-hidden="true">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className={`text-sm font-medium ${isActive ? 'text-eco-700 dark:text-eco-400' : 'text-gray-600 dark:text-gray-400'}`}>
        {config.label}
      </span>
    </button>
  );
}
