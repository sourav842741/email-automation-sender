const variantClasses = {
  success: 'badge-success',
  danger: 'badge-danger',
  warning: 'badge-warning',
  info: 'badge-info',
  default: 'badge-default',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  return (
    <span className={`badge ${variantClasses[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
