import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, CheckCircle2, XCircle, AlertCircle, Send, Copy, Table2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { parseRecipients } from '../../utils/validation.js';
import Button from '../ui/Button.jsx';
import GlassCard from '../ui/GlassCard.jsx';
import TextArea from '../ui/TextArea.jsx';
import Badge from '../ui/Badge.jsx';

export default function Recipients() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState(null);

  useEffect(() => {
    if (input.trim()) {
      const result = parseRecipients(input);
      setParsed(result);
    } else {
      setParsed(null);
    }
  }, [input]);

  const handleSendToAll = () => {
    if (!parsed || parsed.valid.length === 0) { toast.error('No valid recipients'); return; }
    navigate('/send', { state: { recipients: parsed.valid.map((r) => r.email) } });
  };

  const handleCopyAll = () => {
    if (!parsed) return;
    navigator.clipboard.writeText(parsed.valid.map((r) => r.email).join('\n'));
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white">Recipients</h2>
            {parsed && (
              <div className="flex items-center gap-2">
                <Badge variant="success">{parsed.counts.valid} valid</Badge>
                {parsed.counts.invalid > 0 && <Badge variant="danger">{parsed.counts.invalid} invalid</Badge>}
                {parsed.counts.duplicate > 0 && <Badge variant="warning">{parsed.counts.duplicate} duplicates</Badge>}
              </div>
            )}
          </div>
          <TextArea
            rows={8}
            placeholder="Paste email addresses here (one per line, comma or semicolon separated)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </GlassCard>

      {parsed && parsed.valid.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">Valid Recipients ({parsed.valid.length})</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" icon={Copy} onClick={handleCopyAll}>Copy</Button>
                <Button size="sm" icon={Send} onClick={handleSendToAll}>Send to All</Button>
              </div>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {parsed.valid.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl p-3 bg-indigo-50/40 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{r.email}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {parsed && parsed.counts.invalid > 0 && (
        <GlassCard>
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Invalid Entries ({parsed.counts.invalid})</h3>
          <div className="space-y-2">
            {parsed.invalid.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl p-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{entry}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {parsed && parsed.counts.duplicate > 0 && (
        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">{parsed.counts.duplicate} Duplicates Removed</h3>
          </div>
          <div className="space-y-2">
            {parsed.duplicates.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl p-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{d.email}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {!input.trim() && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center mb-4">
            <Table2 className="h-7 w-7 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No recipients yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
            Paste your recipient list above or import from CSV on the Send page to get started.
          </p>
        </div>
      )}
    </div>
  );
}
