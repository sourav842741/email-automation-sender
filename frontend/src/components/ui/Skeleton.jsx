export default function Skeleton({ variant = 'text', width, height, count = 1, className = '' }) {
  const style = {
    text: 'skeleton h-4 rounded-xl',
    circular: 'skeleton rounded-full',
    rectangular: 'skeleton rounded-2xl',
  };

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          className={`${style[variant]} ${className}`}
          style={{
            width: width || (variant === 'circular' ? '40px' : '100%'),
            height: height || (variant === 'circular' ? '40px' : variant === 'text' ? '16px' : '100px'),
          }}
        />
      ))}
    </>
  );
}
