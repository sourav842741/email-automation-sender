import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-50/80 backdrop-blur-sm dark:bg-zinc-950/80">
      <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading...</p>
    </div>
  );
}
