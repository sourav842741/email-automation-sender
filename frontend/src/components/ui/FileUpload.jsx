import { useState, useRef, useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';

export default function FileUpload({
  accept,
  maxSize,
  onFileSelect,
  currentFile = null,
  label = 'Upload file',
  error: externalError,
  icon: Icon = Upload,
  className = '',
}) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validate = useCallback((file) => {
    if (!file) return 'No file selected.';
    if (accept) {
      const exts = accept.split(',').map((a) => a.trim().toLowerCase());
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      const mimeOk = exts.some((a) => {
        if (a.endsWith('/*')) return file.type.startsWith(a.replace('/*', '/'));
        return a === fileExt || a === file.type;
      });
      if (!mimeOk) return `File type not accepted. Allowed: ${accept}`;
    }
    if (maxSize && file.size > maxSize) {
      const mb = maxSize / (1024 * 1024);
      return `File exceeds ${mb.toFixed(0)} MB limit.`;
    }
    return '';
  }, [accept, maxSize]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    const err = validate(file);
    if (err) { setError(err); return; }
    setError('');
    onFileSelect(file);
  }, [validate, onFileSelect]);

  const handleChange = useCallback((e) => {
    const file = e.target.files[0];
    const err = validate(file);
    if (err) { setError(err); return; }
    setError('');
    onFileSelect(file);
  }, [validate, onFileSelect]);

  const handleClick = () => inputRef.current?.click();

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const displayError = error || externalError;

  if (currentFile) {
    return (
      <div className={`flex items-center gap-4 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-700/50 p-4 bg-indigo-50/30 dark:bg-indigo-900/10 ${className}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
          <File className="h-5 w-5 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">
            {currentFile.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">{formatSize(currentFile.size)}</p>
        </div>
        <button type="button" onClick={handleClick} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Change</button>
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
            : 'border-indigo-200 dark:border-indigo-700/50 hover:border-indigo-300 dark:hover:border-indigo-600'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-indigo-400" />
        </div>
        <p className="text-sm font-bold text-gray-700 dark:text-zinc-300">{label}</p>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Drag & drop or click to browse</p>
        {accept && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Accepted: {accept}</p>}
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      </div>
      {displayError && (
        <p className="mt-2 flex items-center gap-1 text-xs text-red-500 font-medium">
          <X className="h-3.5 w-3.5" /> {displayError}
        </p>
      )}
    </div>
  );
}
