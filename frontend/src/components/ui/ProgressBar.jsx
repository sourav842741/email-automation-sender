import { motion } from 'framer-motion';

const variantClasses = {
  primary: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
  success: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
  warning: 'bg-gradient-to-r from-amber-400 to-orange-500',
};

const sizes = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

export default function ProgressBar({ value = 0, label, variant = 'primary', size = 'md', className = '', showLabel = true }) {
  const clamped = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-zinc-300">{label}</span>
          {showLabel && (
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className={`${sizes[size]} rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`${sizes[size]} ${variantClasses[variant]} rounded-full`}
        />
      </div>
    </div>
  );
}
