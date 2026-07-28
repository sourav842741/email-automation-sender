import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Mail } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { formatDateTime } from '../../utils/formatters.js';

function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDateTime(date);
}

export default function RecentActivity({ logs, loading }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Recent Activity</h2>
        <Link
          to="/history"
          className="flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
        >
          View All <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : !logs || logs.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No recent activity"
          description="Your sent email history will appear here once you start sending applications."
        />
      ) : (
        <div className="space-y-1">
          {logs.slice(0, 10).map((log) => {
            const isSuccess = log.status === 'success' || log.status === 'sent';
            return (
              <div
                key={log._id || log.id}
                className="flex items-center gap-4 rounded-xl p-3.5 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-default"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSuccess ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                  {isSuccess ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} /> : <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" strokeWidth={1.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {log.name || log.recipientName || log.email}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">{log.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={isSuccess ? 'success' : 'danger'} size="sm">
                    {isSuccess ? 'Sent' : 'Failed'}
                  </Badge>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">{timeAgo(log.sentAt || log.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
