import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileBadge, ExternalLink, Trash2, Upload as UploadIcon, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../../context/AppContext.jsx';
import Button from '../ui/Button.jsx';
import GlassCard from '../ui/GlassCard.jsx';
import FileUpload from '../ui/FileUpload.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { formatFileSize, formatDateTime } from '../../utils/formatters.js';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '../../utils/constants.js';

const acceptString = Object.keys(ACCEPTED_FILE_TYPES).map((k) => ACCEPTED_FILE_TYPES[k]).join(',');

export default function Resume() {
  const { resume, loading, uploadResume, deleteResume } = useApp();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile) { toast.error('Please select a file first'); return; }
    setUploading(true);
    try { await uploadResume(selectedFile); setSelectedFile(null); }
    catch { toast.error('Failed to upload resume'); }
    finally { setUploading(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteResume(); setShowDeleteConfirm(false); }
    catch { toast.error('Failed to delete resume'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      {!resume && !loading.resume && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No resume uploaded yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
            Upload your resume to enable automated job applications. We support PDF, DOC, and DOCX formats.
          </p>
        </div>
      )}

      <GlassCard>
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {resume ? 'Update Resume' : 'Upload Resume'}
          </h2>
          <FileUpload
            accept={acceptString}
            maxSize={MAX_FILE_SIZE}
            onFileSelect={setSelectedFile}
            currentFile={selectedFile}
            label="Upload your resume"
          />
          {selectedFile && (
            <div className="flex items-center gap-3">
              <Button onClick={handleUpload} loading={uploading} icon={UploadIcon}>Upload</Button>
              <Button variant="ghost" onClick={() => setSelectedFile(null)}>Cancel</Button>
            </div>
          )}
        </div>
      </GlassCard>

      {resume && (
        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Current Resume</h2>
            <div className="flex items-start gap-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 p-4">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                <FileBadge className="h-5 w-5 text-primary-600 dark:text-primary-400" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50 truncate">{resume.originalName || resume.fileName || 'Resume'}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {resume.size ? formatFileSize(resume.size) : ''}{resume.uploadedAt ? ` · ${formatDateTime(resume.uploadedAt)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {resume.fileName && (
                  <a href={`/uploads/${resume.fileName}`} target="_blank" rel="noopener noreferrer" className="btn-ghost p-2 rounded-lg">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => setShowDeleteConfirm(true)}>Delete</Button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Resume"
        message="Are you sure you want to delete your resume? This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
