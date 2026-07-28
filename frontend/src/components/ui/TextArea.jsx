export default function TextArea({
  label,
  placeholder,
  value,
  onChange,
  rows = 4,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="label">{label}</label>
      )}
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`input resize-none ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
