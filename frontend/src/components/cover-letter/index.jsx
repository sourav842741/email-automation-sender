import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Upload, Trash2, FileText, Save, Plus, Check, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext.jsx';
import FileUpload from '../ui/FileUpload.jsx';
import Tabs from '../ui/Tabs.jsx';
import Modal from '../ui/Modal.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { formatDateTime, formatFileSize } from '../../utils/formatters.js';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '../../utils/constants.js';

const acceptString = Object.keys(ACCEPTED_FILE_TYPES).map((k) => ACCEPTED_FILE_TYPES[k]).join(',');

export default function CoverLetter() {
  const { coverLetters, activeCoverLetter, loading, saveCoverLetter, updateCoverLetter, deleteCoverLetter, setActiveCoverLetter } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openCreate = () => {
    setEditingId(null); setTitle(''); setText(''); setSelectedFile(null); setActiveTab('editor'); setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id || item.id);
    setTitle(item.title || '');
    setText(item.type === 'text' ? (item.templateText || '') : '');
    setSelectedFile(null);
    setActiveTab(item.type === 'file' ? 'upload' : 'editor');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Please enter a title'); return; }
    setSaving(true);
    try {
      if (editingId) await updateCoverLetter(editingId, { title: title.trim(), templateText: text });
      else if (activeTab === 'editor') {
        if (!text.trim()) { toast.error('Please enter cover letter text'); return; }
        await saveCoverLetter({ title: title.trim(), type: 'text', templateText: text });
      } else {
        if (!selectedFile) { toast.error('Please select a file'); return; }
        const fd = new FormData();
        fd.append('title', title.trim());
        fd.append('coverLetter', selectedFile);
        fd.append('type', 'file');
        await saveCoverLetter(fd);
      }
      setShowModal(false);
    } catch { toast.error('Failed to save cover letter'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try { await deleteCoverLetter(deleteId); setDeleteId(null); }
    catch { toast.error('Failed to delete'); }
    finally { setDeleting(false); }
  };

  const handleSetActive = async (id) => {
    try { await setActiveCoverLetter(id); }
    catch { toast.error('Failed to set active'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cover Letters</h1>
          <p className="page-subtitle">Manage multiple cover letters. Active one is used when sending emails.</p>
        </div>
        <motion.button
          type="button"
          onClick={openCreate}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 0.97 }}
          className="btn btn-primary px-6 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          New Cover Letter
        </motion.button>
      </div>

      {loading.coverLetter ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />)}</div>
      ) : coverLetters.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-800/70 flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-zinc-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">No cover letters yet</h3>
          <p className="text-sm text-zinc-500 text-center max-w-sm mb-6">Create your first cover letter to personalize job applications.</p>
          <motion.button
            type="button"
            onClick={openCreate}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 0.97 }}
            className="btn btn-primary px-6 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            Create Cover Letter
          </motion.button>
        </div>
      ) : (
        <div className="space-y-3">
          {coverLetters.map((item, idx) => (
            <motion.div key={item._id || item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <div className={`card p-6 ${item.active ? 'ring-2 ring-emerald-500/50' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${item.active ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                      <FileText className={`h-5 w-5 ${item.active ? 'text-emerald-600' : 'text-zinc-500'}`} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.title || 'Untitled'}</h3>
                        {item.active && <span className="badge badge-info px-2.5 py-1 text-xs">Active</span>}
                        <span className={`badge ${item.type === 'text' ? 'badge-default' : 'badge-warning'} px-2 py-0.5 text-[10px]`}>{item.type === 'text' ? 'Text' : 'File'}</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" strokeWidth={1.5} />{item.uploadedAt ? formatDateTime(item.uploadedAt) : '-'}</span>
                        {item.type === 'text' && item.templateText && <span>{item.templateText.length} chars</span>}
                        {item.type === 'file' && item.uploadedFile?.size && <span>{formatFileSize(item.uploadedFile.size)}</span>}
                      </p>
                      {item.type === 'text' && item.templateText && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 whitespace-pre-wrap mt-2">{item.templateText}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!item.active && (
                      <motion.button
                        type="button"
                        onClick={() => handleSetActive(item._id || item.id)}
                        whileTap={{ scale: 0.94 }}
                        whileHover={{ scale: 0.97 }}
                        className="btn btn-ghost p-2 rounded-xl"
                        title="Set active"
                      >
                        <Check className="h-4 w-4" strokeWidth={1.5} />
                      </motion.button>
                    )}
                    <motion.button
                      type="button"
                      onClick={() => openEdit(item)}
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ scale: 0.97 }}
                      className="btn btn-ghost p-2 rounded-xl"
                      title="Edit"
                    >
                      <Edit3 className="h-4 w-4" strokeWidth={1.5} />
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setDeleteId(item._id || item.id)}
                      whileTap={{ scale: 0.94 }}
                      whileHover={{ scale: 0.97 }}
                      className="btn btn-ghost p-2 rounded-xl"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Cover Letter' : 'New Cover Letter'} size="lg">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="label">Title / Name</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Software Engineer Cover Letter"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          {!editingId && <Tabs tabs={[{ id: 'editor', label: 'Text Editor' }, { id: 'upload', label: 'Upload File' }]} activeTab={activeTab} onChange={setActiveTab} />}
          {activeTab === 'editor' ? (
            <div className="space-y-1.5">
              <label className="label">Content</label>
              <textarea
                rows={10}
                className="input resize-none"
                placeholder="Write your cover letter here. Use {{name}}, {{jobTitle}}, {{company}}, {{myName}}, {{date}}"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          ) : (
            <FileUpload accept={acceptString} maxSize={MAX_FILE_SIZE} onFileSelect={setSelectedFile} currentFile={selectedFile} label="Upload cover letter file" />
          )}
          <div className="text-xs text-zinc-400 font-medium">Placeholders: {'{{name}}'} {'{{jobTitle}}'} {'{{company}}'} {'{{myName}}'} {'{{date}}'}</div>
          <div className="flex justify-end gap-3 pt-2">
            <motion.button
              type="button"
              onClick={() => setShowModal(false)}
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 0.97 }}
              className="btn btn-ghost px-6 py-2.5 text-sm"
            >
              Cancel
            </motion.button>
            <motion.button
              type="button"
              onClick={handleSave}
              disabled={saving}
              whileTap={saving ? {} : { scale: 0.94 }}
              whileHover={saving ? {} : { scale: 0.97 }}
              className="btn btn-primary px-6 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" strokeWidth={1.5} />
              )}
              {editingId ? 'Update' : 'Save'}
            </motion.button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Cover Letter" message="Are you sure you want to delete this cover letter?" confirmText="Delete" loading={deleting} />
    </div>
  );
}
