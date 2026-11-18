type ProgressBarProps = { value: number; label?: string; showValue?: boolean };

export default function ProgressBar({ value, label, showValue = false }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  return <div aria-label={label ?? `${safeValue}% complete`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}>
    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${safeValue}%` }} /></div>
    {showValue && <div className="mt-1 text-right text-xs text-gray-500">{safeValue}%</div>}
  </div>;
}
