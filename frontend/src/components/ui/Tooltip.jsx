import { motion, AnimatePresence } from 'framer-motion';

const positions = {
  top: { top: -8, left: '50%', x: '-50%', y: '-100%' },
  bottom: { bottom: -8, left: '50%', x: '-50%', y: '100%' },
  left: { left: -8, top: '50%', x: '-100%', y: '-50%' },
  right: { right: -8, top: '50%', x: '100%', y: '-50%' },
};

export default function Tooltip({ children, content, position = 'top', className = '' }) {
  const pos = positions[position];

  return (
    <div className={`relative inline-flex ${className}`}>
      <AnimatePresence>
        {content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'absolute',
              [pos.top !== undefined ? 'top' : 'bottom']: pos.top ?? pos.bottom,
              [pos.left !== undefined ? 'left' : 'right']: pos.left ?? pos.right,
              transform: `translate(${pos.x}, ${pos.y})`,
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 dark:bg-zinc-700 rounded-xl shadow-lg whitespace-nowrap z-50 pointer-events-none"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </div>
  );
}
