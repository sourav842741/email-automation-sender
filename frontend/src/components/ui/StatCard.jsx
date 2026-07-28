import { motion } from 'framer-motion';

const colorClasses = {
  indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-200 dark:shadow-indigo-900/30',
  emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200 dark:shadow-emerald-900/30',
  amber: 'from-amber-500 to-amber-600 shadow-amber-200 dark:shadow-amber-900/30',
  red: 'from-red-500 to-red-600 shadow-red-200 dark:shadow-red-900/30',
  purple: 'from-purple-500 to-purple-600 shadow-purple-200 dark:shadow-purple-900/30',
};

export default function StatCard({ icon: Icon, label, value, subtext, color = 'indigo', loading = false, className = '' }) {
  if (loading) {
    return (
      <div className={`card p-6 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-10 w-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-6 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-32 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      className={`card p-6 ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
        {label}
      </p>
      {subtext && (
        <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 font-semibold">
          {subtext}
        </p>
      )}
    </motion.div>
  );
}
