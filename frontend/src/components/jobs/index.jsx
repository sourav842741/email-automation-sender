import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, ExternalLink, Clock, MapPin, Search, Building2,
  IndianRupee, RefreshCw, Sparkles, Linkedin, ChevronLeft, ChevronRight,
  Globe, GraduationCap, Filter, X, Download, Mail,
  AlertCircle, WifiOff, FileText, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getJobs, getPlatforms, scrapeJobs, exportJobsCsv, getLastScrape, getScrapingStatus, stopScrape } from '../../services/jobService.js';
import GlassCard from '../ui/GlassCard.jsx';

const PLATFORM_META = {
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'bg-blue-500', badge: 'info' },
  indeed: { label: 'Indeed', icon: FileText, color: 'bg-indigo-500', badge: 'info' },
  glassdoor: { label: 'Glassdoor', icon: Globe, color: 'bg-green-500', badge: 'success' },
  internshala: { label: 'Internshala', icon: GraduationCap, color: 'bg-rose-500', badge: 'warning' },
  naukri: { label: 'Naukri', icon: Briefcase, color: 'bg-orange-500', badge: 'default' },
};

const DEFAULT_PLATFORMS = ['linkedin', 'indeed', 'internshala', 'glassdoor'];

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function formatSalary(min, max) {
  if (!min && !max) return null;
  const fmt = (v) => v >= 100 ? `${(v / 100).toFixed(1)}L` : `${v}L`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max)}`;
}

function PlatformIcon({ source, className = 'h-3.5 w-3.5' }) {
  const meta = PLATFORM_META[source];
  if (!meta) return <Briefcase className={className} />;
  const Icon = meta.icon;
  return <Icon className={className} />;
}

function SalaryBadge({ min, max }) {
  const salary = formatSalary(min, max);
  if (!salary) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
      <IndianRupee className="h-3 w-3" />
      {salary}
    </span>
  );
}

function TimeBadge({ date }) {
  const label = timeAgo(date);
  if (!label) return null;
  const isFresh = label.includes('m') || label.includes('h') || label === 'Just now' || label === 'Yesterday';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${
      isFresh
        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
        : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400'
    }`}>
      <Clock className="h-3 w-3" />
      {label}
    </span>
  );
}

function PlatformBadge({ source }) {
  const meta = PLATFORM_META[source] || { label: source, color: 'bg-zinc-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-sm`} style={{ backgroundColor: meta.color.replace('bg-', '#') }}>
      <PlatformIcon source={source} className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

function EmailBadge({ email }) {
  if (!email) return null;
  return (
    <a
      href={`mailto:${email}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
    >
      <Mail className="h-3 w-3" />
      {email}
    </a>
  );
}

function JobCard({ job, index }) {
  const meta = PLATFORM_META[job.source];

  return (
    <motion.a
      href={job.application_url || job.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: 'easeOut' }}
      className="group block"
    >
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-primary-500/5 dark:to-primary-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-start gap-4">
          <div className={`hidden sm:flex w-12 h-12 rounded-2xl ${meta?.color || 'bg-zinc-500'} bg-opacity-10 dark:bg-opacity-20 items-center justify-center shrink-0 shadow-inner`} style={{ backgroundColor: (meta?.color || 'bg-zinc-500').replace('bg-', '') + '1A' }}>
            <PlatformIcon source={job.source} className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <PlatformBadge source={job.source} />
              <SalaryBadge min={job.salary_min} max={job.salary_max} />
              <TimeBadge date={job.posted_date} />
              <EmailBadge email={job.email} />
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {job.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {job.company && (
                <span className="flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-300">
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  {job.company}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  {job.location}
                </span>
              )}
              {job.employment_type && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  {job.employment_type}
                </span>
              )}
            </div>
            {job.description && (
              <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-relaxed border-l-2 border-zinc-200 dark:border-zinc-700 pl-3">
                {job.description.replace(/<[^>]*>/g, '').substring(0, 250)}
              </p>
            )}
          </div>
          <ExternalLink className="h-4 w-4 text-zinc-300 dark:text-zinc-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors shrink-0 mt-2 hidden sm:block" />
        </div>
      </GlassCard>
    </motion.a>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card p-5 rounded-2xl animate-pulse">
          <div className="flex items-start gap-4">
            <div className="hidden sm:block w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-5 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-5 w-28 rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
              <div className="h-5 w-3/4 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-4 w-1/2 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-4 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ search, platformFilter, scraping, onScrape }) {
  return (
    <GlassCard className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center mx-auto mb-5 shadow-inner">
        <Briefcase className="h-8 w-8 text-zinc-400" />
      </div>
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">No jobs found</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
        {search || platformFilter
          ? 'No jobs match your search criteria. Try different keywords or remove filters.'
          : 'Your job board is empty. Click below to scrape the latest listings from LinkedIn, Indeed, Glassdoor & Internshala.'}
      </p>
      {!search && !platformFilter && (
        <button onClick={onScrape} disabled={scraping} className="btn-primary !px-6 !py-3 text-sm font-bold rounded-xl mt-6 shadow-lg shadow-primary-200 dark:shadow-primary-900/30">
          <Sparkles className={`h-4 w-4 ${scraping ? 'animate-spin' : ''}`} />
          {scraping ? 'Scraping...' : 'Fetch Latest Jobs'}
        </button>
      )}
    </GlassCard>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <GlassCard className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center mx-auto mb-5 shadow-inner">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Failed to load jobs</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">{message}</p>
      <button onClick={onRetry} className="btn-primary !px-6 !py-3 text-sm font-bold rounded-xl mt-6">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </GlassCard>
  );
}

function OfflineState({ onRetry }) {
  return (
    <GlassCard className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 flex items-center justify-center mx-auto mb-5 shadow-inner">
        <WifiOff className="h-8 w-8 text-amber-400" />
      </div>
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Network error</h3>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
        Could not connect to the server. Please check your backend is running and try again.
      </p>
      <button onClick={onRetry} className="btn-primary !px-6 !py-3 text-sm font-bold rounded-xl mt-6">
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </GlassCard>
  );
}

function timeSince(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hrs > 24) return `${Math.floor(hrs / 24)}d ago`;
  if (hrs > 0) return `${hrs}h ${mins}m ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [lastScrapeAt, setLastScrapeAt] = useState(null);
  const searchTimeout = useRef(null);
  const pollRef = useRef(null);
  const scrapingRef = useRef(false);
  const fetchJobsRef = useRef(null);

  const fetchPlatforms = useCallback(async () => {
    try {
      const { data } = await getPlatforms();
      if (data?.success) setPlatforms(data.data || []);
    } catch { /* platform list is non-critical */ }
  }, []);

  const fetchJobs = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 50, _t: Date.now() };
      if (platformFilter) params.platform = platformFilter;
      if (search.trim()) params.keyword = search.trim();
      const { data } = await getJobs(params);
      if (data?.success) {
        const jobsData = data.data.jobs || [];
        setJobs(jobsData);
        setTotal(data.data.total || 0);
        setPages(data.data.pages || 0);
        if (data.data.lastScrapeAt) setLastScrapeAt(data.data.lastScrapeAt);
        const s = {};
        jobsData.forEach((j) => { s[j.source] = (s[j.source] || 0) + 1; });
        setStats(s);
      } else if (!background) {
        setError('Unexpected response from server');
      }
    } catch (err) {
      if (!background) {
        if (err.code === 'ERR_NETWORK') setError('network');
        else setError(err.response?.data?.message || 'Failed to load jobs');
      }
    }
    if (!background) setLoading(false);
  }, [page, platformFilter, search]);

  useEffect(() => { fetchJobsRef.current = fetchJobs; }, [fetchJobs]);
  useEffect(() => { fetchPlatforms(); }, [fetchPlatforms]);
  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (!search.trim()) { setPage(1); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  useEffect(() => {
    const tick = async () => {
      const status = await getScrapingStatus().catch(() => ({ data: { data: { scraping: false } } }));
      const isRunning = status?.data?.data?.scraping;
      if (isRunning && !scrapingRef.current) {
        scrapingRef.current = true;
        setScraping(true);
        setScrapeMsg('Scraping in progress...');
      } else if (!isRunning && scrapingRef.current) {
        scrapingRef.current = false;
        setScraping(false);
        setScrapeMsg('Scrape complete!');
        fetchJobsRef.current?.(true);
        setTimeout(() => setScrapeMsg(''), 5000);
        return;
      }
      if (isRunning) fetchJobsRef.current?.(true);
    };
    tick();
    pollRef.current = setInterval(tick, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleScrape = async () => {
    try {
      await scrapeJobs({});
    } catch { /* ignore */ }
  };

  const handleStopScrape = async () => {
    try {
      await stopScrape();
      setScraping(false);
      scrapingRef.current = false;
      setScrapeMsg('Scrape stopped');
      setTimeout(() => setScrapeMsg(''), 3000);
      toast.success('Scraping stopped');
    } catch { toast.error('Failed to stop'); }
  };

  const handleDownloadCsv = async () => {
    setDownloadLoading(true);
    try {
      const params = {};
      if (platformFilter) params.platform = platformFilter;
      if (search.trim()) params.keyword = search.trim();
      const response = await exportJobsCsv(params);
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jobs-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded!');
    } catch {
      toast.error('CSV download failed');
    }
    setDownloadLoading(false);
  };

  const displayedJobs = useMemo(() => jobs, [jobs]);
  const currentStats = useMemo(() => {
    return Object.fromEntries(DEFAULT_PLATFORMS.map((p) => [p, stats[p] || 0]));
  }, [stats]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <GlassCard className="!p-0 !bg-transparent !shadow-none !border-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200 dark:shadow-primary-900/30">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">Job Listings</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {loading ? 'Loading...' : `${total} jobs across ${platforms.length} platforms`}
                {lastScrapeAt && !loading && (
                  <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                    · Last scrape: {timeSince(lastScrapeAt)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {scrapeMsg && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-full">
                {scrapeMsg}
              </motion.span>
            )}
            <button onClick={handleDownloadCsv} disabled={downloadLoading || jobs.length === 0} className="btn-ghost !px-3 !py-2.5 text-xs font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed" title="Download CSV">
              <Download className={`h-4 w-4 ${downloadLoading ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline ml-1.5">CSV</span>
            </button>
            {scraping ? (
              <button onClick={handleStopScrape} className="btn-danger !px-4 !py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-red-200 dark:shadow-red-900/30">
                <X className="h-4 w-4" />
                Stop
              </button>
            ) : (
              <button onClick={handleScrape} className="btn-primary !px-4 !py-2.5 text-xs font-bold rounded-xl shadow-lg shadow-primary-200 dark:shadow-primary-900/30 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Scrape Now
              </button>
            )}
            <button onClick={() => { setPage(1); fetchJobs(); }} className="btn-ghost !px-3 !py-2.5 text-xs font-semibold rounded-xl">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {DEFAULT_PLATFORMS.map((p) => {
          const meta = PLATFORM_META[p];
          const count = currentStats[p] || 0;
          return (
            <motion.button
              key={p}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setPlatformFilter(platformFilter === p ? '' : p); setPage(1); }}
              className={`card p-3 sm:p-4 text-left transition-all ${
                platformFilter === p
                  ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-200 dark:shadow-primary-900/20'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${meta?.color || 'bg-zinc-500'} flex items-center justify-center shadow-sm`}>
                  <PlatformIcon source={p} className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{meta?.label || p}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{count} jobs</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400" />
          <input
            type="text"
            placeholder="Search by title, company, skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-11 pr-10 rounded-xl"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-400 pointer-events-none z-10" />
          <select
            value={platformFilter}
            onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
            className="input pl-11 pr-10 min-w-[160px] appearance-none rounded-xl cursor-pointer"
          >
            <option value="">All Platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>{PLATFORM_META[p]?.label || p}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && error === 'network' && <OfflineState onRetry={() => fetchJobs()} />}

      {!loading && error && error !== 'network' && <ErrorState message={error} onRetry={() => fetchJobs()} />}

      {!loading && !error && jobs.length === 0 && (
        <EmptyState search={search} platformFilter={platformFilter} scraping={scraping} onScrape={handleScrape} />
      )}

      {!loading && !error && jobs.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-full">
              Showing {Math.min((page - 1) * 50 + 1, total)}–{Math.min(page * 50, total)} of {total} jobs
            </p>
            <button onClick={handleDownloadCsv} disabled={downloadLoading} className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
              <Download className={`h-3.5 w-3.5 ${downloadLoading ? 'animate-pulse' : ''}`} />
              {downloadLoading ? 'Preparing...' : 'Download CSV'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            <div className="space-y-3" key={`${platformFilter}-${page}-${search}`}>
              {displayedJobs.map((job, i) => (
                <JobCard key={job.id || job._id || i} job={job} index={i} />
              ))}
            </div>
          </AnimatePresence>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 pb-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-ghost p-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {(() => {
                const items = [];
                for (let i = 1; i <= pages; i++) {
                  if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
                    items.push(i);
                  } else if (items[items.length - 1] !== '...') {
                    items.push('...');
                  }
                }
                return items.map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="px-2 text-xs text-zinc-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
                        p === page
                          ? 'bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-primary-900/30'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      }`}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost p-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
