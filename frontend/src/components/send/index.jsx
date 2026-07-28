import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Eye, Pause, Play, StopCircle, Clock, CheckCircle2, XCircle,
  FileText, FileBadge, Table2, Loader2, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { uploadCsvFile } from '../../services/emailService.js';
import Modal from '../ui/Modal.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { parseRecipients } from '../../utils/validation.js';
import { PLACEHOLDER_REGEX } from '../../utils/constants.js';

function fillPlaceholders(text, data) {
  if (!text) return '';
  return text.replace(PLACEHOLDER_REGEX, (_, key) => {
    const lower = key.toLowerCase();
    const map = {
      name: data.name || '',
      jobtitle: data.jobTitle || '',
      company: data.company || '',
      myname: data.myName || '',
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    };
    return map[lower] || '';
  });
}

export default function SendEmails() {
  const location = useLocation();
  const { settings, resume, activeCoverLetter, sendingState, sendEmails, pauseSending, resumeSending, cancelSending } = useApp();
  const fileInputRef = useRef(null);

  const [recipientsText, setRecipientsText] = useState('');
  const [subject, setSubject] = useState('');
  const [delay, setDelay] = useState(10);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvFileName, setCsvFileName] = useState('');

  useEffect(() => {
    if (location.state?.recipients) setRecipientsText(location.state.recipients.join('\n'));
  }, [location.state]);

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);
    setCsvFileName(file.name);
    try {
      const response = await uploadCsvFile(file);
      const data = response?.data;
      if (data?.emails?.length) {
        const existing = recipientsText ? recipientsText.trim().split(/[\n]/).filter(Boolean) : [];
        setRecipientsText([...existing, ...data.emails].join('\n'));
        toast.success(`${data.emails.length} emails extracted from CSV`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to parse CSV');
      setCsvFileName('');
    } finally {
      setCsvUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const result = parsed || parseRecipients(recipientsText);

  const getPreviewData = () => {
    const first = result.valid[0];
    if (!first) return null;
    const greeting = settings.fallbackGreeting || 'Dear Hiring Team';
    const vars = { name: greeting, myName: settings.myName || '' };
    const body = fillPlaceholders((activeCoverLetter?.type === 'text' ? activeCoverLetter?.templateText : '') || '', vars);
    return {
      subject: fillPlaceholders(subject || settings.defaultSubject || '', vars),
      body: body || fillPlaceholders(greeting, vars),
      name: first.name,
      email: first.email,
    };
  };

  const openPreview = () => {
    setParsed(parseRecipients(recipientsText));
    if (result.valid.length === 0) { toast.error('No valid recipients found'); return; }
    setPreviewOpen(true);
  };

  const handleSend = async () => {
    const r = parseRecipients(recipientsText);
    setParsed(r);
    if (r.valid.length === 0) { toast.error('No valid recipients found'); return; }
    try {
      await sendEmails({ recipients: recipientsText, subject, delay: delay * 1000 });
    } catch { toast.error('Failed to send emails'); }
  };

  const isSending = sendingState.active;
  const progress = sendingState.total > 0 ? (sendingState.current / sendingState.total) * 100 : 0;
  const preview = getPreviewData();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white">Recipients</h2>
                <span className={`badge ${result.counts.valid > 0 ? 'badge-success' : 'badge-default'} px-2 py-0.5 text-[10px]`}>
                  {result.counts.valid} valid
                </span>
              </div>
              <textarea
                rows={6}
                className="input resize-none"
                placeholder="Enter email addresses (one per line or comma separated)"
                value={recipientsText}
                onChange={(e) => setRecipientsText(e.target.value)}
              />
              {recipientsText && result.counts.invalid > 0 && (
                <p className="text-xs text-red-500 font-medium">{result.counts.invalid} invalid, {result.counts.duplicate} duplicates</p>
              )}
              <div className="flex items-center gap-3 pt-2 border-t border-zinc-200/70 dark:border-zinc-800/70">
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={handleCsvUpload} className="hidden" />
                <motion.button
                  type="button"
                  disabled={csvUploading}
                  onClick={() => fileInputRef.current?.click()}
                  whileTap={csvUploading ? {} : { scale: 0.94 }}
                  whileHover={csvUploading ? {} : { scale: 0.97 }}
                  className="btn btn-outline px-4 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {csvUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Table2 className="h-4 w-4" strokeWidth={1.5} />
                  )}
                  {csvFileName || 'Import CSV'}
                </motion.button>
                {csvFileName && !csvUploading && <span className="text-xs text-emerald-600 font-medium">Emails added</span>}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 dark:text-white">Email Details</h2>
              <div className="space-y-1.5">
                <label className="label">Subject</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Application for job position"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <p className="-mt-2 text-xs text-zinc-400 font-medium">Placeholders: {'{{name}}'}, {'{{myName}}'}, {'{{date}}'}</p>
              <div className="space-y-1.5">
                <label className="label">Delay between emails (seconds)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="10"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 dark:text-white">Attachments</h2>
              <div className={`flex items-center gap-3 rounded-2xl border-2 p-4 ${resume ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10' : 'border-zinc-200/70 dark:border-zinc-800/70'}`}>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${resume ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  <FileBadge className={`h-4 w-4 ${resume ? 'text-emerald-600' : 'text-zinc-400'}`} strokeWidth={1.5} />
                </div>
                <span className={`text-sm font-semibold ${resume ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500'}`}>
                  {resume?.originalName || 'No resume attached'}
                </span>
              </div>
              <div className={`flex items-center gap-3 rounded-2xl border-2 p-4 ${activeCoverLetter ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10' : 'border-zinc-200/70 dark:border-zinc-800/70'}`}>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${activeCoverLetter ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                  <FileText className={`h-4 w-4 ${activeCoverLetter ? 'text-emerald-600' : 'text-zinc-400'}`} strokeWidth={1.5} />
                </div>
                <span className={`text-sm font-semibold ${activeCoverLetter ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500'}`}>
                  {activeCoverLetter?.type === 'text' ? 'Cover letter ready' : activeCoverLetter?.originalName || 'No cover letter'}
                </span>
              </div>
            </div>
          </div>

          {isSending ? (
            <div className="card p-6">
              <div className="space-y-4">
                <ProgressBar value={progress} label={`Sending ${sendingState.current} / ${sendingState.total}`} variant={sendingState.failed > 0 ? 'warning' : 'primary'} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={1.5} /><span className="text-sm font-bold">{sendingState.success}</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" strokeWidth={1.5} /><span className="text-sm font-bold">{sendingState.failed}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    type="button"
                    onClick={sendingState.paused ? resumeSending : pauseSending}
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 0.97 }}
                    className="btn btn-outline px-4 py-2 text-xs"
                  >
                    {sendingState.paused ? (
                      <Play className="h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <Pause className="h-4 w-4" strokeWidth={1.5} />
                    )}
                    {sendingState.paused ? 'Resume' : 'Pause'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={cancelSending}
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ scale: 0.97 }}
                    className="btn btn-danger px-4 py-2 text-xs"
                  >
                    <StopCircle className="h-4 w-4" strokeWidth={1.5} />
                    Cancel
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-6">
              <div className="space-y-3">
                <motion.button
                  type="button"
                  onClick={openPreview}
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ scale: 0.97 }}
                  className="btn btn-outline w-full px-6 py-2.5 text-sm"
                >
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                  Preview
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSend}
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ scale: 0.97 }}
                  className="btn btn-primary w-full px-6 py-2.5 text-sm"
                >
                  <Send className="h-4 w-4" strokeWidth={1.5} />
                  <Mail className="h-4 w-4" strokeWidth={1.5} />
                  Send{result.counts.valid > 0 ? ` ${result.counts.valid} Emails` : ''}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Email Preview" size="lg">
        {preview ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/70 p-4">
              <p className="text-xs text-zinc-500 mb-1">To: {preview.name} &lt;{preview.email}&gt;</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Subject: {preview.subject}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 p-4">
              <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">{preview.body}</p>
            </div>
            <div className="flex gap-2">
              {resume && <span className="badge badge-success"><FileBadge className="h-3 w-3" strokeWidth={1.5} /> Resume</span>}
              {activeCoverLetter && <span className="badge badge-info px-2.5 py-1 text-xs"><FileText className="h-3 w-3" strokeWidth={1.5} /> Cover Letter</span>}
              {!resume && !activeCoverLetter && <span className="text-xs text-zinc-400">No attachments</span>}
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No preview available.</p>
        )}
      </Modal>
    </div>
  );
}
