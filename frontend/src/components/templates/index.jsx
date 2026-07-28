import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Edit3, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext.jsx';
import Button from '../ui/Button.jsx';
import GlassCard from '../ui/GlassCard.jsx';
import Input from '../ui/Input.jsx';
import Modal from '../ui/Modal.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { formatDateTime } from '../../utils/formatters.js';

const emptyForm = {
  jobTitle: '',
  subjectTemplate: '',
};

export default function Templates() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (tmpl) => {
    setEditing(tmpl);
    setForm({
      jobTitle: tmpl.jobTitle || '',
      subjectTemplate: tmpl.subjectTemplate || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateTemplate(editing._id || editing.id, form);
      } else {
        await createTemplate(form);
      }
      setModalOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTemplate(deleteTarget._id || deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Job Templates
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage email templates for job applications.
          </p>
        </div>
        <Button onClick={openCreate} icon={Plus}>
          Create Template
        </Button>
      </motion.div>

      {loading.templates ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200 bg-white/70 p-5 dark:border-gray-700 dark:bg-gray-900/70"
            >
              <Skeleton className="h-5 w-32 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : !templates || templates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <EmptyState
            icon={FileText}
            title="No email templates"
            description="Create your first email template to start sending personalized job applications."
            action={
              <Button onClick={openCreate} icon={Plus}>
                Create Template
              </Button>
            }
          />
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tmpl, i) => (
            <motion.div
              key={tmpl._id || tmpl.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard>
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary-500" />
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {tmpl.jobTitle || 'Untitled'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(tmpl)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(tmpl)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {tmpl.subjectTemplate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      Subject: {tmpl.subjectTemplate}
                    </p>
                  )}
                  {tmpl.createdAt && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Created {formatDateTime(tmpl.createdAt)}
                    </p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Template' : 'Create Template'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Job Title"
            placeholder="e.g. Software Engineer"
            value={form.jobTitle}
            onChange={(e) => setForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
          />
          <Input
            label="Subject Template"
            placeholder="Application for position"
            value={form.subjectTemplate}
            onChange={(e) => setForm((prev) => ({ ...prev, subjectTemplate: e.target.value }))}
          />
          <p className="-mt-2 text-xs text-gray-400 dark:text-gray-500">Placeholder: {'{{name}}'} {'{{myName}}'} {'{{date}}'}</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} icon={Save}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        message={`Are you sure you want to delete the template for "${deleteTarget?.jobTitle || 'Untitled'}"?`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
