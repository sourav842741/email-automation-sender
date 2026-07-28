import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, Trash2, Clock, CalendarDays, Filter, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext.jsx';
import Table from '../ui/Table.jsx';
import SearchInput from '../ui/SearchInput.jsx';
import Tabs from '../ui/Tabs.jsx';
import Pagination from '../ui/Pagination.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { formatDateTime } from '../../utils/formatters.js';
import * as logService from '../../services/logService.js';

const statusBadgeVariant = {
  success: 'badge-success', sent: 'badge-info', failed: 'badge-danger', pending: 'badge-warning',
  bounced: 'badge-warning', opened: 'badge-success', clicked: 'badge-info',
};

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

  const startRef = useRef(null);
  const endRef = useRef(null);

  const openPicker = (ref) => () => ref.current?.showPicker?.() || ref.current?.click();

  const loadLogs = useCallback(async () => {
    const params = { page, limit, search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined, startDate: startDate || undefined, endDate: endDate || undefined };
    try {
      const res = await fetchLogs(params);
      if (res) { setTotalPages(res?.totalPages || 1); setTotal(res?.total || 0); }
    } catch { setTotalPages(1); setTotal(0); }
  }, [page, limit, search, statusFilter, startDate, endDate, fetchLogs]);

  useEffect(() => { loadLogs(); }, [page, limit, statusFilter, startDate, endDate]);

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

  const columns = [
    { key: 'select', label: '', render: (item) => {
      const id = item._id || item.id;
      return (
        <input type="checkbox" checked={selected.includes(id)} onChange={(e) => {
          if (e.target.checked) setSelected((p) => [...p, id]);
          else setSelected((p) => p.filter((sid) => sid !== id));
        }} className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600" />
      );
    }},
    { key: 'name', label: 'Name', render: (item) => <span className="font-bold text-gray-900 dark:text-white">{item.name || item.recipientName || item.email?.split('@')[0] || 'Unknown'}</span> },
    { key: 'email', label: 'Email', render: (item) => <span className="text-zinc-600 dark:text-zinc-400">{item.email}</span> },
    { key: 'subject', label: 'Subject', render: (item) => <span className="max-w-[200px] truncate block text-zinc-500" title={item.subject}>{item.subject || '-'}</span> },
    { key: 'status', label: 'Status', render: (item) => <span className={`badge ${statusBadgeVariant[item.status] || 'badge-default'} px-2 py-0.5 text-[10px]`}>{item.status || 'Unknown'}</span> },
    { key: 'sentAt', label: 'Date', render: (item) => <span className="text-xs text-zinc-500">{formatDateTime(item.sentAt || item.createdAt)}</span> },
    { key: 'error', label: 'Error', render: (item) => <span className="max-w-[150px] truncate block text-red-500 text-xs" title={item.error || item.errorMessage}>{item.error || item.errorMessage || '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2 className="page-title">Email History</h2>
          <p className="page-subtitle">View and manage your sent email logs.</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={handleExportCSV}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 0.97 }}
            className="btn btn-outline px-4 py-2 text-xs"
          >
            <Download className="h-4 w-4" strokeWidth={1.5} />
            CSV
          </motion.button>
          <motion.button
            type="button"
            onClick={handleExportExcel}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 0.97 }}
            className="btn btn-outline px-4 py-2 text-xs"
          >
            <FileSpreadsheet className="h-4 w-4" strokeWidth={1.5} />
            Excel
          </motion.button>
          <motion.button
            type="button"
            onClick={() => { if (selected.length === 0) toast.error('No logs selected'); else setShowDeleteConfirm(true); }}
            disabled={selected.length === 0}
            whileTap={selected.length === 0 ? {} : { scale: 0.94 }}
            whileHover={selected.length === 0 ? {} : { scale: 0.97 }}
            className="btn btn-danger px-4 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            Delete ({selected.length})
          </motion.button>
        </div>
      </div>

      <div className="card p-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email..." className="flex-1" />
            <div className="flex items-center gap-2">
              <div className="relative cursor-pointer" onClick={openPicker(startRef)}>
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                <input ref={startRef} type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="input pl-10 pr-3 py-2 text-sm w-[150px] cursor-pointer" />
              </div>
              <span className="text-zinc-400 text-xs font-medium">to</span>
              <div className="relative cursor-pointer" onClick={openPicker(endRef)}>
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" strokeWidth={1.5} />
                <input ref={endRef} type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="input pl-10 pr-3 py-2 text-sm w-[150px] cursor-pointer" />
              </div>
            </div>
          </div>

          <Tabs tabs={[{ id: 'all', label: 'All' }, { id: 'success', label: 'Success' }, { id: 'failed', label: 'Failed' }]} activeTab={statusFilter} onChange={(id) => { setStatusFilter(id); setPage(1); }} />

          <Table columns={columns} data={logs || []} loading={loading.logs} emptyMessage="No email logs found." />

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={setPage} onLimitChange={(nl) => { setLimit(nl); setPage(1); }} />
          )}
        </div>
      </div>

      <ConfirmDialog isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDeleteSelected}
        title="Delete Logs" message={`Are you sure you want to delete ${selected.length} selected log(s)?`} confirmText="Delete" loading={deleting} />
    </div>
  );
}
