import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Send, Users, Edit3, FileBadge, Clock, BarChart3, Settings, Briefcase,
  X, Menu, Moon, Sun, ChevronLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/send', icon: Send, label: 'Send Emails' },
  { to: '/recipients', icon: Users, label: 'Recipients' },
  { to: '/cover-letter', icon: Edit3, label: 'Cover Letter' },
  { to: '/resume', icon: FileBadge, label: 'Resume' },
  { to: '/jobs', icon: Briefcase, label: 'Job Listings' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { darkMode, toggleDarkMode } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm shrink-0">
          <span className="text-white text-sm font-bold">M</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">MailFlow</span>
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 leading-tight">email automation</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.5} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 space-y-1">
        <button onClick={toggleDarkMode} className="nav-item w-full">
          {darkMode ? <Sun className="h-4.5 w-4.5" strokeWidth={1.5} /> : <Moon className="h-4.5 w-4.5" strokeWidth={1.5} />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold">SK</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">Sourav Kumar</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">sourav@email.com</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-4.5 w-4.5 text-zinc-600 dark:text-zinc-400" strokeWidth={1.5} />
      </button>

      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
          {navContent}
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-950 shadow-2xl lg:hidden"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
