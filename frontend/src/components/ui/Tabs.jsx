import { motion } from 'framer-motion';

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-800 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id || tab.key || tab.label}
          onClick={() => onChange(tab.id || tab.key || tab.label)}
          className={`tab-pill relative px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
            (tab.id || tab.key || tab.label) === activeTab
              ? 'active text-white'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          {(tab.id || tab.key || tab.label) === activeTab && (
            <motion.div
              layoutId="tab-pill"
              className="absolute inset-0 bg-indigo-600 rounded-xl shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
