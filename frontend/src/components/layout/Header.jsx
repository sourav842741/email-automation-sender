import { Bell } from 'lucide-react';

export default function Header() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-800/50">
      <div className="flex items-center justify-between h-14 pl-10 lg:pl-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/50">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{today}</span>
        </div>

        <div className="flex items-center gap-0.5">
          <button className="relative p-2 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-all duration-150">
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-zinc-50 dark:ring-zinc-950" />
          </button>

          <div className="relative group ml-1">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm shadow-primary-500/15 ring-1 ring-white/30 dark:ring-white/10 cursor-pointer transition-transform duration-150 group-hover:scale-105 group-active:scale-95">
              <span className="text-white text-[11px] font-bold">SK</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-zinc-50 dark:border-zinc-950 rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
}
