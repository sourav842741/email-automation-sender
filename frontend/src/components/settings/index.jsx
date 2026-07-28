import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Save, Server, Mail, User, Shield, Search, MapPin, Globe, Clock, Calendar,
  AtSign, EyeOff, CheckCircle, XCircle, Smartphone, Linkedin, FileText,
  GraduationCap, Briefcase, ChevronDown, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext.jsx';
import { useForm } from 'react-hook-form';

const ALL_PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  { id: 'indeed', label: 'Indeed', icon: FileText, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' },
  { id: 'glassdoor', label: 'Glassdoor', icon: Globe, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  { id: 'internshala', label: 'Internshala', icon: GraduationCap, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20' },
  { id: 'naukri', label: 'Naukri', icon: Briefcase, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
];

const fieldAttrs = {
  myName: { icon: User, label: 'Your Name', placeholder: 'John Doe', hint: 'Used in email signatures and cover letters' },
  email: { icon: AtSign, label: 'Email', placeholder: 'you@example.com', hint: 'Primary email for sending applications' },
  smtpHost: { icon: Server, label: 'SMTP Host', placeholder: 'smtp.gmail.com', hint: 'Your email provider\'s SMTP server' },
  smtpPort: { icon: Smartphone, label: 'SMTP Port', placeholder: '587', hint: 'Common ports: 587 (TLS), 465 (SSL), 25' },
  smtpUser: { icon: Mail, label: 'SMTP Username', placeholder: 'user@gmail.com', hint: 'Usually your full email address' },
  smtpPassword: { icon: EyeOff, label: 'SMTP Password', placeholder: '••••••••', hint: 'App passwords recommended for Gmail/Outlook' },
  senderName: { icon: User, label: 'Sender Name', placeholder: 'Your Name', hint: 'Name recipients will see in their inbox' },
  fallbackGreeting: { icon: Mail, label: 'Fallback Greeting', placeholder: 'Dear Hiring Team', hint: 'Used when recipient name is unknown' },
  defaultSubject: { icon: Mail, label: 'Default Subject', placeholder: 'Application for position', hint: 'Default subject line for emails' },
};

function SectionHeader({ icon: Icon, title, description, color = 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' }) {
  return (
    <div className="flex items-start gap-4 mb-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${color}`}>
        <Icon className="h-5 w-5" strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
        {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, placeholder, hint, error, register, type = 'text', ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />}
        {label}
      </label>
      <div className={`relative transition-all duration-200 rounded-xl ring-1 ${focused ? 'ring-primary-500/50 shadow-sm shadow-primary-500/10' : 'ring-zinc-200 dark:ring-zinc-700'} ${error ? 'ring-red-400 dark:ring-red-500' : ''}`}>
        <input
          type={type}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900/50 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
          {...register}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium flex items-center gap-1"><XCircle className="h-3 w-3" />{error.message}</p>}
      {hint && !error && <p className="text-xs text-zinc-400 dark:text-zinc-500 pl-1">{hint}</p>}
    </div>
  );
}

function ToggleSwitch({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group py-3 px-4 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors -mx-4">
      <div className="relative mt-0.5">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-10 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 peer-checked:bg-primary-600 transition-colors duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{label}</p>
        {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}

export default function Settings() {
  const { settings, darkMode, toggleDarkMode, updateSettings, testSmtp } = useApp();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const debounceRef = useRef(null);
  const [scraperKw, setScraperKw] = useState('');
  const [scraperLoc, setScraperLoc] = useState('');
  const [scraperPlatforms, setScraperPlatforms] = useState([]);
  const [scraperInterval, setScraperInterval] = useState(120);
  const [scraperMaxAge, setScraperMaxAge] = useState(4);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      myName: '', email: '', smtpHost: '', smtpPort: 587, smtpSecure: false,
      smtpUser: '', smtpPassword: '', senderName: '', fallbackGreeting: '', defaultSubject: '',
    },
  });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      Object.entries(settings).forEach(([key, value]) => {
        if (key !== 'scraperConfig') setValue(key, value ?? '');
      });
      const sc = settings.scraperConfig || {};
      setScraperKw((sc.keywords || []).join('\n'));
      setScraperLoc((sc.locations || []).join('\n'));
      setScraperPlatforms(sc.platforms || ['linkedin', 'indeed', 'internshala', 'glassdoor']);
      setScraperInterval(sc.intervalMinutes ?? 120);
      setScraperMaxAge(sc.maxAgeDays ?? 4);
    }
  }, [settings, setValue]);

  const buildPayload = useCallback((formData) => ({
    ...formData,
    scraperConfig: {
      keywords: scraperKw.split('\n').map(s => s.trim()).filter(Boolean),
      locations: scraperLoc.split('\n').map(s => s.trim()).filter(Boolean),
      platforms: scraperPlatforms,
      intervalMinutes: scraperInterval,
      maxAgeDays: scraperMaxAge,
    },
  }), [scraperKw, scraperLoc, scraperPlatforms, scraperInterval, scraperMaxAge]);

  const autoSave = useCallback((data) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try { await updateSettings(buildPayload(data), true); }
      catch { toast.error('Auto-save failed'); }
    }, 3000);
  }, [updateSettings, buildPayload]);

  const watchedValues = watch();
  useEffect(() => {
    if (Object.keys(settings).length > 0) autoSave(watchedValues);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [watchedValues, autoSave, settings, scraperKw, scraperLoc, scraperPlatforms, scraperInterval, scraperMaxAge]);

  const onSubmit = async (data) => {
    setSaving(true);
    try { await updateSettings(buildPayload(data)); toast.success('Settings saved'); }
    catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    try { await testSmtp(watchedValues); toast.success('SMTP connection successful'); }
    catch { toast.error('SMTP test failed'); }
    finally { setTesting(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="card p-6">
        <SectionHeader icon={User} title="Personal Info" description="Your identity used across email communications" color="text-sky-600 bg-sky-50 dark:bg-sky-900/20" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your Name" icon={User} placeholder="John Doe" hint="Used in email signatures and cover letters" error={errors.myName} register={register('myName')} />
          <Field label="Email" icon={AtSign} placeholder="you@example.com" hint="Primary email for sending applications" error={errors.email} register={register('email')} />
        </div>
      </div>

      <div className="card p-6">
        <SectionHeader icon={Server} title="SMTP Configuration" description="Connect your email provider to send applications" color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="SMTP Host" icon={Server} placeholder="smtp.gmail.com" hint="Your email provider's SMTP server" error={errors.smtpHost} register={register('smtpHost')} />
          <Field label="SMTP Port" icon={Smartphone} placeholder="587" hint="Common ports: 587 (TLS), 465 (SSL), 25" error={errors.smtpPort} register={register('smtpPort')} />
          <Field label="SMTP Username" icon={Mail} placeholder="user@gmail.com" hint="Usually your full email address" error={errors.smtpUser} register={register('smtpUser')} />
          <Field label="SMTP Password" icon={EyeOff} placeholder="••••••••" hint="App passwords recommended for Gmail/Outlook" type="password" error={errors.smtpPassword} register={register('smtpPassword')} />
          <div className="sm:col-span-2">
            <ToggleSwitch label="SSL/TLS Secure Connection" description="Enable for encrypted email delivery (recommended)" checked={watchedValues.smtpSecure} onChange={() => setValue('smtpSecure', !watchedValues.smtpSecure)} />
          </div>
        </div>
        <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
          <motion.button
            type="button"
            onClick={handleTestSmtp}
            disabled={testing}
            whileTap={testing ? {} : { scale: 0.97 }}
            className="btn-outline !px-5 !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Server className="h-4 w-4" strokeWidth={1.5} />}
            {testing ? 'Testing...' : 'Test SMTP Connection'}
          </motion.button>
        </div>
      </div>

      <div className="card p-6">
        <SectionHeader icon={Mail} title="Email Defaults" description="Templates for your outgoing applications" color="text-violet-600 bg-violet-50 dark:bg-violet-900/20" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Sender Name" icon={User} placeholder="Your Name" hint="Name recipients will see in their inbox" register={register('senderName')} />
          <Field label="Fallback Greeting" icon={Mail} placeholder="Dear Hiring Team" hint="Used when recipient name is unknown" register={register('fallbackGreeting')} />
          <div className="sm:col-span-2">
            <Field label="Default Subject" icon={Mail} placeholder="Application for position" hint="Default subject line for emails" register={register('defaultSubject')} />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <SectionHeader icon={Search} title="Scraper Configuration" description="Control how and where jobs are discovered" color="text-amber-600 bg-amber-50 dark:bg-amber-900/20" />

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
              Keywords
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal ml-1">(one per line)</span>
            </label>
            <textarea
              value={scraperKw}
              onChange={(e) => setScraperKw(e.target.value)}
              className="w-full min-h-[140px] px-4 py-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-y"
              placeholder="software engineer&#10;frontend developer&#10;react developer"
              spellCheck={false}
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 pl-1">Each keyword runs across all selected platforms</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
              Locations
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal ml-1">(one per line)</span>
            </label>
            <textarea
              value={scraperLoc}
              onChange={(e) => setScraperLoc(e.target.value)}
              className="w-full min-h-[140px] px-4 py-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-mono text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-y"
              placeholder="Bangalore&#10;Mumbai&#10;Delhi NCR&#10;Remote"
              spellCheck={false}
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 pl-1">Locations to search for each keyword</p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
            Platforms
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ALL_PLATFORMS.map((p) => {
              const active = scraperPlatforms.includes(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    setScraperPlatforms((prev) =>
                      active ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                    );
                  }}
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all border ${
                    active
                      ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${active ? p.color : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                    <p.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </div>
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 mt-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
              Auto-scrape interval
            </label>
            <div className="relative">
              <input
                type="number"
                min={10}
                max={1440}
                value={scraperInterval}
                onChange={(e) => setScraperInterval(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500 font-medium">minutes</span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 pl-1">How often the scraper checks for new jobs</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.5} />
              Max job age
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={30}
                value={scraperMaxAge}
                onChange={(e) => setScraperMaxAge(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-zinc-500 font-medium">days</span>
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 pl-1">Older jobs are filtered out during scraping</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">Changes are auto-saved after 3 seconds of inactivity</p>
        <motion.button
          type="submit"
          disabled={saving}
          whileTap={saving ? {} : { scale: 0.97 }}
          className="btn-primary !px-6 !py-3 text-sm shadow-lg shadow-primary-200 dark:shadow-primary-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" strokeWidth={1.5} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </motion.button>
      </div>
    </form>
  );
}
