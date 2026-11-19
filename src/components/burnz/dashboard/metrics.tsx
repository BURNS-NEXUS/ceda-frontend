export type Metric = {
  label: string;
  value: string;
  hint?: string;
};

export default function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/60"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</p>
          <p className="mt-3 text-2xl font-semibold text-ink-800 dark:text-white">
            {metric.value}
          </p>
          {metric.hint ? (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{metric.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
