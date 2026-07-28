import { NavLink } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Send, Briefcase, Clock, Settings } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const bottomItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/send', icon: Send, label: 'Send' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-200 dark:border-zinc-800 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg ${isActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                  <item.icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.5} />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="blob-primary w-[30rem] h-[30rem] -top-40 -left-40" />
        <div className="blob-purple w-[40rem] h-[40rem] top-1/3 -right-48" />
      </div>
      <Sidebar />
      <div className="lg:pl-64 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-12">
          <Header />
          <main className="animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
