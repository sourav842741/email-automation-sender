export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center mb-5">
          <Icon className="h-7 w-7 text-indigo-400" />
        </div>
      )}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-zinc-400 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && action}
    </div>
  );
}
