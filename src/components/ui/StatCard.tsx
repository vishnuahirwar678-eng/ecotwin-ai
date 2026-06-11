import type { StatCard as StatCardType } from '../../types';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, color, trend, trendValue }: StatCardType) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 card-hover">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`} aria-hidden="true">
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && trendValue && (
          <div
            className={`flex items-center gap-1 text-xs font-medium ${
              trend === 'down' ? 'text-eco-600' : trend === 'up' ? 'text-red-500' : 'text-gray-500'
            }`}
            aria-label={`Trend: ${trend === 'down' ? 'decreased' : trend === 'up' ? 'increased' : 'no change'} by ${trendValue}`}
          >
            {trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> :
             trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}
