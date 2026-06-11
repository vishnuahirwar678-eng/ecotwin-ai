export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8';
  return (
    <div
      className={`${sizeClass} border-2 border-eco-500/30 border-t-eco-500 rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}
