import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Trash2, Clock, CalendarDays, Filter, Search, Loader2,
  CheckCircle, XCircle, AlertTriangle, Clock3, Send, Eye, MousePointer2,
  ChevronLeft, ChevronRight, ChevronDown, FileSpreadsheet, Archive,
  Inbox, CheckCheck, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import * as logService from '../../services/logService.js';

const STATUS_CONFIG = {
  success: { icon: CheckCircle, label: 'Success', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  sent: { icon: Send, label: 'Sent', class: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  failed: { icon: XCircle, label: 'Failed', class: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
  pending: { icon: Clock3, label: 'Pending', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  bounced: { icon: AlertTriangle, label: 'Bounced', class: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' },
  opened: { icon: Eye, label: 'Opened', class: 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  clicked: { icon: MousePointer2, label: 'Clicked', class: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' },
};

const TABS = [
  { id: 'all', label: 'All', icon: Inbox },
  { id: 'success', label: 'Success', icon: CheckCheck },
  { id: 'failed', label: 'Failed', icon: AlertCircle },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { icon: Clock3, label: status || 'Unknown', class: 'text-zinc-600 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.class}`}>
      <Icon className="h-3 w-3" strokeWidth={2} />
      {cfg.label}
    </span>
  );
}

function EmptyState({ search, statusFilter }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 shadow-inner">
        <Inbox className="h-6 w-6 text-zinc-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 mb-1">No email logs found</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
        {search || statusFilter !== 'all'
          ? 'No logs match your current filters. Try adjusting your search or filter criteria.'
          : 'Your sent email history will appear here once you start sending applications.'}
      </p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
      <div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse" />
      <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
      <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
    </div>
  );
}

export default function History() {
  const { logs, loading, fetchLogs, deleteLogs } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const searchRef = useRef(null);

  const loadLogs = useCallback(async () => {
    const params = {
      page, limit,
      search: search || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    try {
      const res = await fetchLogs(params);
      if (res) { setTotalPages(res?.totalPages || 1); setTotal(res?.total || 0); }
    } catch { setTotalPages(1); setTotal(0); }
  }, [page, limit, search, statusFilter, startDate, endDate, fetchLogs]);

  useEffect(() => { loadLogs(); }, [page, limit, statusFilter, startDate, endDate]);

  useEffect(() => {
    if (!search) { setPage(1); return; }
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleExportCSV = async () => {
    try {
      const { data } = await logService.exportCSV();
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = 'email-logs.csv'; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch { toast.error('Failed to export CSV'); }
  };

  const handleExportExcel = async () => {
    try {
      const { data } = await logService.exportExcel();
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = 'email-logs.xlsx'; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel exported');
    } catch { toast.error('Failed to export Excel'); }
  };

  const handleDeleteSelected = async () => {
    if (selected.length === 0) { toast.error('No logs selected'); return; }
    setDeleting(true);
    try { await deleteLogs(selected); setSelected([]); setShowDeleteConfirm(false); loadLogs(); }
    catch { toast.error('Failed to delete logs'); }
    finally { setDeleting(false); }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (!logs || logs.length === 0) return;
    const allIds = logs.map((l) => l._id || l.id);
    setSelected((prev) => prev.length === logs.length ? [] : allIds);
  };

  const allSelected = logs?.length > 0 && selected.length === logs.length;

  const formatError = (item) => item.error || item.errorMessage || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200 dark:shadow-primary-900/30">
            <Archive className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">Email History</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {loading.logs ? 'Loading...' : `${total} log${total !== 1 ? 's' : ''} recorded`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-ghost !px-3 !py-2 text-xs font-semibold rounded-xl">
            <Download className="h-4 w-4" strokeWidth={1.5} />
            CSV
          </button>
          <button onClick={handleExportExcel} className="btn-ghost !px-3 !py-2 text-xs font-semibold rounded-xl">
            <FileSpreadsheet className="h-4 w-4" strokeWidth={1.5} />
            Excel
          </button>
          <button
            onClick={() => { if (selected.length === 0) toast.error('No logs selected'); else setShowDeleteConfirm(true); }}
            disabled={selected.length === 0}
            className="btn-danger !px-3 !py-2 text-xs font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Delete</span>
            {selected.length > 0 && <span className="ml-1">({selected.length})</span>}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="p-5 pb-0 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="w-[145px] pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                />
              </div>
              <span className="text-xs text-zinc-400 font-medium">to</span>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="w-[145px] pl-10 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl w-fit">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2">
          {loading.logs ? (
            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
              {[1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} />)}
            </div>
          ) : !logs || logs.length === 0 ? (
            <EmptyState search={search} statusFilter={statusFilter} />
          ) : (
            <>
              <div className="hidden md:block">
                <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="w-4 flex items-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500 dark:border-zinc-600"
                    />
                  </div>
                  <div className="flex-1 grid grid-cols-12 gap-3 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <span className="col-span-2">Name</span>
                    <span className="col-span-2">Email</span>
                    <span className="col-span-3">Subject</span>
                    <span className="col-span-1">Status</span>
                    <span className="col-span-2">Date</span>
                    <span className="col-span-2">Error</span>
                  </div>
                </div>
                <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  <AnimatePresence mode="popLayout">
                    {logs.map((item, i) => {
                      const id = item._id || item.id;
                      const errMsg = formatError(item);
                      return (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30 ${selected.includes(id) ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                        >
                          <div className="w-4 flex items-center">
                            <input
                              type="checkbox"
                              checked={selected.includes(id)}
                              onChange={() => toggleSelect(id)}
                              className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500 dark:border-zinc-600"
                            />
                          </div>
                          <div className="flex-1 grid grid-cols-12 gap-3 text-sm items-center">
                            <div className="col-span-2 min-w-0">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{item.name || item.recipientName || item.email?.split('@')[0] || 'Unknown'}</p>
                            </div>
                            <div className="col-span-2 min-w-0">
                              <p className="text-zinc-500 dark:text-zinc-400 truncate text-[13px]">{item.email}</p>
                            </div>
                            <div className="col-span-3 min-w-0">
                              <p className="text-zinc-500 dark:text-zinc-400 truncate text-[13px]" title={item.subject}>{item.subject || '-'}</p>
                            </div>
                            <div className="col-span-1">
                              <StatusBadge status={item.status} />
                            </div>
                            <div className="col-span-2 min-w-0">
                              <p className="text-[13px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <Clock className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                                <span>{formatDateTime(item.sentAt || item.createdAt)}</span>
                              </p>
                            </div>
                            <div className="col-span-2 min-w-0">
                              {errMsg ? (
                                <p className="text-[13px] text-red-500 truncate flex items-center gap-1" title={errMsg}>
                                  <XCircle className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                                  <span className="truncate">{errMsg}</span>
                                </p>
                              ) : (
                                <span className="text-[13px] text-zinc-300 dark:text-zinc-600">—</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                <AnimatePresence mode="popLayout">
                  {logs.map((item, i) => {
                    const id = item._id || item.id;
                    const errMsg = formatError(item);
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 transition-colors ${selected.includes(id) ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(id)}
                            onChange={() => toggleSelect(id)}
                            className="mt-1 h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500 dark:border-zinc-600 shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{item.name || item.email?.split('@')[0] || 'Unknown'}</p>
                              <StatusBadge status={item.status} />
                            </div>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{item.email}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate" title={item.subject}>{item.subject || '-'}</p>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-zinc-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" strokeWidth={1.5} />
                                {formatDateTime(item.sentAt || item.createdAt)}
                              </p>
                              {errMsg && (
                                <p className="text-xs text-red-500 truncate flex items-center gap-1" title={errMsg}>
                                  <XCircle className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                                  <span className="truncate max-w-[120px]">{errMsg}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              {(() => {
                const items = [];
                for (let i = 1; i <= totalPages; i++) {
                  if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
                    items.push(i);
                  } else if (items[items.length - 1] !== '...') {
                    items.push('...');
                  }
                }
                return items.map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-1.5 text-xs text-zinc-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        p === page
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteSelected}
        title="Delete Logs"
        message={`Are you sure you want to delete ${selected.length} selected log${selected.length !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
