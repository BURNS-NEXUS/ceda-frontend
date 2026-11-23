interface DetailFieldProps {
  label: string;
  value?: string | number | null;
}

export default function DetailField({ label, value }: DetailFieldProps) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2.5 dark:border-ink-700">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-ink-800 dark:text-gray-200">
        {empty ? "Not provided" : String(value)}
      </dd>
    </div>
  );
}
