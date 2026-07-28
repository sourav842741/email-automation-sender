import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, Globe, Activity, TrendingUp, Mail, AlertCircle, Briefcase, Search, Clock, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { getJobAnalytics } from '../../services/jobService.js';
import StatsGrid from '../dashboard/StatsGrid.jsx';

function WeeklyChart({ data }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.count || d.total || 0), 1);
  const total = data.reduce((s, d) => s + (d.count || d.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-1.5 h-48 pt-2">
        {data.map((d, i) => {
          const val = d.count || d.total || 0;
          const height = (val / maxVal) * 100;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {val}
              </motion.span>
              <div className="w-full relative" style={{ height: `calc(${height}% - 8px)` }}>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: '100%', opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 shadow-sm shadow-primary-200 dark:shadow-primary-900/30"
                />
                <div className="absolute inset-0 rounded-t-lg bg-white/10 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">{val > 0 ? `${pct}%` : ''}</span>
              <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">{(d.day || d._id || d.date || '').slice(0, 3)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Total this week</span>
        <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{total}</span>
      </div>
    </div>
  );
}

function AnimatedDonut({ value, color, label, delay = 0 }) {
  const [progress, setProgress] = useState(0);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  useEffect(() => {
    const t = setTimeout(() => setProgress(value), 100 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-100 dark:text-zinc-800" />
          <motion.circle
            cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
            className="drop-shadow-sm"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 + delay / 1000 }}
            className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
          >
            {Math.round(value)}%
          </motion.span>
        </div>
      </div>
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}

function PieChartComponent({ success, failed }) {
  const total = success + failed;
  if (total === 0) return (
    <div className="flex items-center justify-center h-48 text-sm text-zinc-400 font-medium">
      <div className="text-center">
        <PieChart className="h-10 w-10 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
        <p>No data yet</p>
      </div>
    </div>
  );
  const sPct = (success / total) * 100;
  const fPct = (failed / total) * 100;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-2">
      <AnimatedDonut value={sPct} color="#22c55e" label="Success" delay={0} />
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/30 rounded-xl px-4 py-3 min-w-[180px]">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Success</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{success} <span className="text-sm font-medium text-zinc-400">({Math.round(sPct)}%)</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 min-w-[180px]">
          <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">Failed</p>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{failed} <span className="text-sm font-medium text-zinc-400">({Math.round(fPct)}%)</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DomainChart({ domains }) {
  if (!domains || domains.length === 0) return null;
  const maxCount = Math.max(...domains.map((d) => d.count), 1);
  const sorted = [...domains].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-3">
      {sorted.map((d, i) => {
        const pct = (d.count / maxCount) * 100;
        return (
          <motion.div
            key={d._id || d.domain || i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="group"
          >
            <div className="flex items-center gap-3 mb-1.5">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 capitalize">{d._id || d.domain || d.platform}</span>
              </div>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.06, type: 'spring', stiffness: 200 }}
                className="text-xs font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg px-2.5 py-1"
              >
                {d.count}
              </motion.span>
            </div>
            <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function PlatformCard({ platform, count, index }) {
  const colors = {
    linkedin: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', bar: 'from-blue-500 to-blue-400' },
    indeed: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', bar: 'from-indigo-500 to-indigo-400' },
    glassdoor: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', bar: 'from-green-500 to-green-400' },
    internshala: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', bar: 'from-amber-500 to-amber-400' },
  };
  const c = colors[platform?.toLowerCase()] || { bg: 'bg-zinc-50 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', bar: 'from-zinc-500 to-zinc-400' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className={`card p-4 border-l-4 ${c.bg} border-l-current`}
      style={{ borderLeftColor: 'currentColor' }}
    >
      <p className={`text-sm font-medium ${c.text} capitalize`}>{platform}</p>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">{count}</p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">jobs scraped</p>
    </motion.div>
  );
}

export default function Analytics() {
  const { analytics, templates, resume, loading, fetchAnalytics } = useApp();
  const [jobAnalytics, setJobAnalytics] = useState(null);
  const [jobAnalyticsLoading, setJobAnalyticsLoading] = useState(true);

  useEffect(() => {
    if (!analytics?.totalSent && analytics?.totalSent !== 0) fetchAnalytics();
  }, []);

  useEffect(() => {
    let mounted = true;
    setJobAnalyticsLoading(true);
    getJobAnalytics()
      .then((res) => {
        if (mounted) {
          setJobAnalytics(res?.data?.data || res?.data || null);
          setJobAnalyticsLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setJobAnalyticsLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const weeklyData = analytics?.weeklyStats || analytics?.weeklyData || [];
  const successCount = analytics?.successCount || analytics?.totalSent || 0;
  const failureCount = analytics?.failureCount || 0;
  const domainData = analytics?.topDomains || analytics?.domainStats || [];

  const jPlatforms = jobAnalytics?.platforms || [];
  const jDailyTrend = jobAnalytics?.dailyTrend || [];
  const jTotalJobs = jobAnalytics?.totalJobs || 0;
  const jEmailsFound = jobAnalytics?.emailsFound || 0;
  const jEmailsMissing = jobAnalytics?.emailsMissing || 0;
  const jLastScrapeAt = jobAnalytics?.lastScrapeAt || null;

  const formatDate = (iso) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <StatsGrid analytics={analytics} templates={templates} resume={resume} loading={loading.analytics} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary-600 dark:text-primary-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Weekly Activity</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Email sending trend this week</p>
            </div>
          </div>
          {loading.analytics ? (
            <div className="h-52 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ) : weeklyData.length > 0 ? <WeeklyChart data={weeklyData} /> : (
            <div className="flex flex-col items-center py-10">
              <Activity className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-zinc-400 font-medium">No weekly data</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <PieChart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Success vs Failure</h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Delivery rate breakdown</p>
            </div>
          </div>
          {loading.analytics ? (
            <div className="h-48 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          ) : <PieChartComponent success={successCount} failed={failureCount} />}
        </div>

        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Top Email Domains</h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Most used recipient domains</p>
              </div>
            </div>
            {loading.analytics ? (
              <div className="space-y-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
            ) : domainData.length > 0 ? <DomainChart domains={domainData} /> : (
              <div className="flex flex-col items-center py-10">
                <Globe className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" strokeWidth={1.5} />
                <p className="text-sm text-zinc-400 font-medium">No domain data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Search className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Job Scrape Analytics</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Scraping activity across platforms</p>
          </div>
        </div>

        {jobAnalyticsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-4">
                <div className="h-4 w-20 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-3" />
                <div className="h-8 w-16 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="card p-4 bg-gradient-to-br from-indigo-50 to-indigo-50/50 dark:from-indigo-900/15 dark:to-indigo-900/5 border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-indigo-500" strokeWidth={1.5} />
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Jobs</p>
                </div>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{jTotalJobs}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }} className="card p-4 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-900/15 dark:to-blue-900/5 border-blue-100 dark:border-blue-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-blue-500" strokeWidth={1.5} />
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Platforms</p>
                </div>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{jPlatforms.length}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.16 }} className="card p-4 bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-900/15 dark:to-emerald-900/5 border-emerald-100 dark:border-emerald-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Emails Found</p>
                </div>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{jEmailsFound}</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.24 }} className="card p-4 bg-gradient-to-br from-zinc-50 to-zinc-50/50 dark:from-zinc-800/30 dark:to-zinc-800/10 border-zinc-100 dark:border-zinc-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Last Scrape</p>
                </div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-1">{formatDate(jLastScrapeAt)}</p>
              </motion.div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Platform Distribution</h2>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Jobs scraped per platform</p>
                  </div>
                </div>
                {jPlatforms.length > 0 ? <DomainChart domains={jPlatforms} /> : (
                  <div className="flex flex-col items-center py-10">
                    <Globe className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" strokeWidth={1.5} />
                    <p className="text-sm text-zinc-400 font-medium">No platform data</p>
                  </div>
                )}
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Daily Scrape Trend</h2>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">Jobs found per day</p>
                  </div>
                </div>
                {jDailyTrend.length > 0 ? <WeeklyChart data={jDailyTrend} /> : (
                  <div className="flex flex-col items-center py-10">
                    <Activity className="h-10 w-10 text-zinc-300 dark:text-zinc-600 mb-3" strokeWidth={1.5} />
                    <p className="text-sm text-zinc-400 font-medium">No daily trend data</p>
                  </div>
                )}
              </div>
            </div>

            {jPlatforms.length > 0 && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {jPlatforms.map((p, i) => (
                  <PlatformCard key={p.platform} platform={p.platform} count={p.count} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}