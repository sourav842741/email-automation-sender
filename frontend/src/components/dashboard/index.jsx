import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight, Rocket, Upload, FileText, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { useNavigate } from 'react-router-dom';
import StatsGrid from './StatsGrid.jsx';
import RecentActivity from './RecentActivity.jsx';
import LoadingScreen from '../layout/LoadingScreen.jsx';
import Button from '../ui/Button.jsx';

export default function Dashboard() {
  const { analytics, templates, resume, logs, loading, settings, fetchAnalytics, fetchLogs } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!analytics?.totalSent && analytics?.totalSent !== 0) fetchAnalytics();
    if (!logs || logs.length === 0) fetchLogs({ limit: 10 });
  }, []);

  const isLoaded = !loading.analytics && !loading.logs && analytics && logs !== undefined;

  if (!isLoaded && (loading.analytics || loading.logs)) return <LoadingScreen />;

  const userName = settings?.myName || 'there';

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-gradient p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white text-xs font-medium rounded-lg px-3 py-1 mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome back
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Hey, {userName}! 👋</h2>
            <p className="text-white/70 text-sm max-w-md">
              You&apos;ve sent {analytics?.totalSent || 0} emails so far. Keep up the great work!
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="secondary" size="sm" icon={Rocket} onClick={() => navigate('/send')}>
              Send Campaign
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-white/60 text-xs font-medium">Today</p>
            <p className="text-2xl font-bold">{analytics?.todayCount || 0}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium">Success Rate</p>
            <p className="text-2xl font-bold">{analytics?.successRate || 0}%</p>
          </div>
          <div>
            <p className="text-white/60 text-xs font-medium">Total Sent</p>
            <p className="text-2xl font-bold">{analytics?.totalSent || 0}</p>
          </div>
        </div>
      </motion.div>

      <StatsGrid analytics={analytics} templates={templates} resume={resume} loading={loading.analytics} />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentActivity logs={logs} loading={loading.logs} />
        </div>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => navigate('/resume')} className="nav-item w-full">
                <Upload className="h-4 w-4" /> Upload Resume
              </button>
              <button onClick={() => navigate('/cover-letter')} className="nav-item w-full">
                <FileText className="h-4 w-4" /> Create Cover Letter
              </button>
              <button onClick={() => navigate('/recipients')} className="nav-item w-full">
                <Users className="h-4 w-4" /> Import Recipients
              </button>
              <button onClick={() => navigate('/send')} className="nav-item w-full">
                <Rocket className="h-4 w-4" /> Send Campaign
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
