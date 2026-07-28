import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import * as settingsService from '../services/settingsService.js';
import * as resumeService from '../services/resumeService.js';
import * as coverLetterService from '../services/coverLetterService.js';
import * as emailService from '../services/emailService.js';
import * as templateService from '../services/templateService.js';
import * as logService from '../services/logService.js';
import * as analyticsService from '../services/analyticsService.js';

const AppContext = createContext(null);

const INITIAL_SENDING_STATE = {
  active: false,
  current: 0,
  total: 0,
  success: 0,
  failed: 0,
  paused: false,
  cancelled: false,
  estimatedTime: 0,
};

function extractData(response) {
  const body = response?.data;
  return body?.data ?? body;
}

export function AppProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [resume, setResume] = useState(null);
  const [coverLetters, setCoverLetters] = useState([]);
  const [activeCoverLetter, setActiveCoverLetter] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState({
    settings: false,
    resume: false,
    coverLetter: false,
    templates: false,
    logs: false,
    analytics: false,
  });
  const [sendingState, setSendingState] = useState(INITIAL_SENDING_STATE);
  const pollingRef = useRef(null);

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem('darkMode');
      if (stored !== null) return stored === 'true';
    } catch {}
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('darkMode', String(darkMode));
    } catch {}
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => !prev);
  }, []);

  const setLoadingKey = useCallback((key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoadingKey('settings', true);
    try {
      const response = await settingsService.getSettings();
      const result = extractData(response);
      setSettings(result || {});
    } catch {
    } finally {
      setLoadingKey('settings', false);
    }
  }, [setLoadingKey]);

  const updateSettings = useCallback(async (data, silent = false) => {
    try {
      const response = await settingsService.updateSettings(data);
      const result = extractData(response);
      setSettings(result || {});
      if (!silent) toast.success('Settings updated successfully');
      return result;
    } catch {
      throw new Error('Failed to update settings');
    }
  }, []);

  const fetchResume = useCallback(async () => {
    setLoadingKey('resume', true);
    try {
      const response = await resumeService.getResume();
      const result = extractData(response);
      setResume(result || null);
    } catch {
      setResume(null);
    } finally {
      setLoadingKey('resume', false);
    }
  }, [setLoadingKey]);

  const uploadResumeAction = useCallback(async (file) => {
    try {
      const response = await resumeService.uploadResume(file);
      const result = extractData(response);
      setResume(result);
      toast.success('Resume uploaded successfully');
      return result;
    } catch {
      throw new Error('Failed to upload resume');
    }
  }, []);

  const deleteResumeAction = useCallback(async () => {
    try {
      await resumeService.deleteResume();
      setResume(null);
      toast.success('Resume deleted');
    } catch {
      throw new Error('Failed to delete resume');
    }
  }, []);

  const fetchCoverLetters = useCallback(async () => {
    setLoadingKey('coverLetter', true);
    try {
      const response = await coverLetterService.getCoverLetters();
      const result = extractData(response);
      const list = Array.isArray(result) ? result : [];
      setCoverLetters(list);
      const active = list.find((l) => l.active);
      setActiveCoverLetter(active || null);
    } catch {
      setCoverLetters([]);
      setActiveCoverLetter(null);
    } finally {
      setLoadingKey('coverLetter', false);
    }
  }, [setLoadingKey]);

  const saveCoverLetterAction = useCallback(async (data) => {
    try {
      const response = await coverLetterService.saveCoverLetter(data);
      const result = extractData(response);
      await fetchCoverLetters();
      toast.success('Cover letter saved');
      return result;
    } catch {
      throw new Error('Failed to save cover letter');
    }
  }, [fetchCoverLetters]);

  const updateCoverLetterAction = useCallback(async (id, data) => {
    try {
      const response = await coverLetterService.updateCoverLetter(id, data);
      const result = extractData(response);
      await fetchCoverLetters();
      toast.success('Cover letter updated');
      return result;
    } catch {
      throw new Error('Failed to update cover letter');
    }
  }, [fetchCoverLetters]);

  const setActiveCoverLetterAction = useCallback(async (id) => {
    try {
      const response = await coverLetterService.setActiveCoverLetter(id);
      const result = extractData(response);
      await fetchCoverLetters();
      toast.success('Active cover letter updated');
      return result;
    } catch {
      throw new Error('Failed to set active cover letter');
    }
  }, [fetchCoverLetters]);

  const deleteCoverLetterAction = useCallback(async (id) => {
    try {
      await coverLetterService.deleteCoverLetter(id);
      await fetchCoverLetters();
      toast.success('Cover letter deleted');
    } catch {
      throw new Error('Failed to delete cover letter');
    }
  }, [fetchCoverLetters]);

  const fetchTemplates = useCallback(async () => {
    setLoadingKey('templates', true);
    try {
      const response = await templateService.getTemplates();
      const result = extractData(response);
      setTemplates(Array.isArray(result) ? result : []);
    } catch {
      setTemplates([]);
    } finally {
      setLoadingKey('templates', false);
    }
  }, [setLoadingKey]);

  const createTemplate = useCallback(async (data) => {
    try {
      const response = await templateService.createTemplate(data);
      const result = extractData(response);
      setTemplates((prev) => [...prev, result]);
      toast.success('Template created');
      return result;
    } catch {
      throw new Error('Failed to create template');
    }
  }, []);

  const updateTemplate = useCallback(async (id, data) => {
    try {
      const response = await templateService.updateTemplate(id, data);
      const result = extractData(response);
      setTemplates((prev) => prev.map((t) => (t._id === id || t.id === id ? result : t)));
      toast.success('Template updated');
      return result;
    } catch {
      throw new Error('Failed to update template');
    }
  }, []);

  const deleteTemplate = useCallback(async (id) => {
    try {
      await templateService.deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t._id !== id && t.id !== id));
      toast.success('Template deleted');
    } catch {
      throw new Error('Failed to delete template');
    }
  }, []);

  const fetchLogs = useCallback(async (params) => {
    setLoadingKey('logs', true);
    try {
      const response = await logService.getLogs(params);
      const result = extractData(response);
      const logsData = result?.data || result?.logs || result || [];
      setLogs(Array.isArray(logsData) ? logsData : []);
      return result;
    } catch {
      setLogs([]);
    } finally {
      setLoadingKey('logs', false);
    }
  }, [setLoadingKey]);

  const deleteLogsAction = useCallback(async (ids) => {
    try {
      await logService.deleteLogs(ids);
      setLogs((prev) => prev.filter((l) => !ids.includes(l._id) && !ids.includes(l.id)));
      toast.success('Logs deleted');
    } catch {
      throw new Error('Failed to delete logs');
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoadingKey('analytics', true);
    try {
      const response = await analyticsService.getAnalytics();
      const result = extractData(response);
      setAnalytics(result || {});
    } catch {
      setAnalytics({});
    } finally {
      setLoadingKey('analytics', false);
    }
  }, [setLoadingKey]);

  const testSmtpAction = useCallback(async (data) => {
    try {
      const response = await emailService.testSmtp(data);
      const result = extractData(response);
      toast.success('SMTP test successful');
      return result;
    } catch {
      throw new Error('SMTP test failed');
    }
  }, []);

  const updateSendingState = useCallback((partial) => {
    setSendingState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetSendingState = useCallback(() => {
    setSendingState(INITIAL_SENDING_STATE);
  }, []);

  const sendEmails = useCallback(
    async (data) => {
      const total = data.recipients
        ? (typeof data.recipients === 'string'
            ? data.recipients.split(/[\n;,]+/).filter(Boolean).length
            : data.recipients.length)
        : 0;
      setSendingState({ ...INITIAL_SENDING_STATE, active: true, total });
      try {
        await emailService.sendEmails(data, (event) => {
          if (event.type === 'progress') {
            setSendingState((prev) => ({
              ...prev,
              current: event.current,
              total: event.total,
              success: event.status === 'success' ? prev.success + 1 : prev.success,
              failed: event.status === 'failed' ? prev.failed + 1 : prev.failed,
            }));
          } else if (event.type === 'complete') {
            setSendingState((prev) => ({ ...prev, active: false }));
            toast.success('All emails sent successfully');
          } else if (event.type === 'error') {
            setSendingState((prev) => ({ ...prev, active: false }));
            toast.error(event.message || 'Failed to send emails');
          }
        });
      } catch (err) {
        setSendingState((prev) => ({ ...prev, active: false }));
        toast.error(err.message || 'Failed to send emails');
      }
    },
    []
  );

  const handlePauseSending = useCallback(async () => {
    try {
      await emailService.pauseSending();
      updateSendingState({ paused: true });
    } catch {
      toast.error('Failed to pause');
    }
  }, [updateSendingState]);

  const handleResumeSending = useCallback(async () => {
    try {
      await emailService.resumeSending();
      updateSendingState({ paused: false });
    } catch {
      toast.error('Failed to resume');
    }
  }, [updateSendingState]);

  const handleCancelSending = useCallback(async () => {
    try {
      await emailService.cancelSending();
      setSendingState(INITIAL_SENDING_STATE);
    } catch {
      toast.error('Failed to cancel');
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchResume();
    fetchCoverLetters();
    fetchTemplates();
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const value = {
    settings,
    resume,
    coverLetters,
    activeCoverLetter,
    templates,
    logs,
    analytics,
    loading,
    darkMode,
    sendingState,
    fetchSettings,
    fetchResume,
    fetchCoverLetters,
    fetchTemplates,
    fetchLogs,
    fetchAnalytics,
    updateSettings,
    uploadResume: uploadResumeAction,
    deleteResume: deleteResumeAction,
    saveCoverLetter: saveCoverLetterAction,
    updateCoverLetter: updateCoverLetterAction,
    setActiveCoverLetter: setActiveCoverLetterAction,
    deleteCoverLetter: deleteCoverLetterAction,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    deleteLogs: deleteLogsAction,
    sendEmails,
    testSmtp: testSmtpAction,
    toggleDarkMode,
    pauseSending: handlePauseSending,
    resumeSending: handleResumeSending,
    cancelSending: handleCancelSending,
    resetSendingState,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
