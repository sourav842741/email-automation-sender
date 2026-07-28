import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Server, Mail, User, Shield, Sun, Moon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext.jsx';
import { useForm } from 'react-hook-form';

export default function Settings() {
  const { settings, darkMode, toggleDarkMode, updateSettings, testSmtp } = useApp();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const debounceRef = useRef(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      myName: '', email: '', smtpHost: '', smtpPort: 587, smtpSecure: false,
      smtpUser: '', smtpPassword: '', senderName: '', fallbackGreeting: '', defaultSubject: '',
    },
  });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      Object.entries(settings).forEach(([key, value]) => setValue(key, value ?? ''));
    }
  }, [settings, setValue]);

  const autoSave = useCallback((data) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try { await updateSettings(data, true); }
      catch { toast.error('Auto-save failed'); }
    }, 3000);
  }, [updateSettings]);

  const watchedValues = watch();
  useEffect(() => {
    if (Object.keys(settings).length > 0) autoSave(watchedValues);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [watchedValues, autoSave, settings]);

  const onSubmit = async (data) => {
    setSaving(true);
    try { await updateSettings(data); toast.success('Settings saved'); }
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <User className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-white">Personal Info</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="label">Your Name</label>
            <input type="text" className="input" placeholder="John Doe" {...register('myName')} />
            {errors.myName?.message && <p className="text-xs text-red-500 font-medium">{errors.myName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="label">Email</label>
            <input type="email" className="input" placeholder="you@example.com" {...register('email')} />
            {errors.email?.message && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Server className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-white">SMTP Configuration</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="label">SMTP Host</label>
            <input type="text" className="input" placeholder="smtp.gmail.com" {...register('smtpHost')} />
            {errors.smtpHost?.message && <p className="text-xs text-red-500 font-medium">{errors.smtpHost.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="label">SMTP Port</label>
            <input type="number" className="input" placeholder="587" {...register('smtpPort')} />
            {errors.smtpPort?.message && <p className="text-xs text-red-500 font-medium">{errors.smtpPort.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="label">SMTP Username</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" strokeWidth={1.5} />
              <input type="text" className="input pl-11" placeholder="user@gmail.com" {...register('smtpUser')} />
            </div>
            {errors.smtpUser?.message && <p className="text-xs text-red-500 font-medium">{errors.smtpUser.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="label">SMTP Password</label>
            <div className="relative">
              <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" strokeWidth={1.5} />
              <input type="password" className="input pl-11" placeholder="••••••••" {...register('smtpPassword')} />
            </div>
            {errors.smtpPassword?.message && <p className="text-xs text-red-500 font-medium">{errors.smtpPassword.message}</p>}
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" id="smtpSecure" {...register('smtpSecure')}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-600" />
            <label htmlFor="smtpSecure" className="text-sm font-medium text-gray-700 dark:text-zinc-300">Use SSL/TLS (Secure connection)</label>
          </div>
        </div>
        <div className="mt-4">
          <motion.button
            type="button"
            onClick={handleTestSmtp}
            disabled={testing}
            whileTap={testing ? {} : { scale: 0.94 }}
            whileHover={testing ? {} : { scale: 0.97 }}
            className="btn btn-outline px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Server className="h-4 w-4" strokeWidth={1.5} />
            )}
            Test SMTP Connection
          </motion.button>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <Mail className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
          </div>
          <h2 className="font-bold text-gray-900 dark:text-white">Email Defaults</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="label">Sender Name</label>
            <input type="text" className="input" placeholder="Your Name" {...register('senderName')} />
            {errors.senderName?.message && <p className="text-xs text-red-500 font-medium">{errors.senderName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="label">Fallback Greeting</label>
            <input type="text" className="input" placeholder="Dear Hiring Team" {...register('fallbackGreeting')} />
            {errors.fallbackGreeting?.message && <p className="text-xs text-red-500 font-medium">{errors.fallbackGreeting.message}</p>}
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label className="label">Default Subject</label>
            <input type="text" className="input" placeholder="Application for position" {...register('defaultSubject')} />
            {errors.defaultSubject?.message && <p className="text-xs text-red-500 font-medium">{errors.defaultSubject.message}</p>}
          </div>
        </div>
      </div>

      

      <div className="flex justify-end">
        <motion.button
          type="submit"
          disabled={saving}
          whileTap={saving ? {} : { scale: 0.94 }}
          whileHover={saving ? {} : { scale: 0.97 }}
          className="btn btn-primary px-8 py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" strokeWidth={1.5} />
          )}
          Save Settings
        </motion.button>
      </div>
    </form>
  );
}
