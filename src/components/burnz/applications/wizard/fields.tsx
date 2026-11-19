"use client";

import type { WizardValues } from "./types";
import type { UseFormRegister } from "react-hook-form";
import { cn } from "@/utils";

export type FieldConfig = {
  name: keyof WizardValues;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "date" | "number" | "tel";
  hint?: string;
  wide?: boolean;
};

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-ink-800 outline-none transition-colors placeholder:text-gray-400 focus:border-action-500 focus:ring-2 focus:ring-action-500/15 dark:border-ink-700 dark:bg-ink-950 dark:text-white dark:placeholder:text-gray-600";

export function TextField({
  config,
  register,
  error,
}: {
  config: FieldConfig;
  register: UseFormRegister<WizardValues>;
  error?: string;
}) {
  return (
    <label className={cn("block text-sm font-medium text-ink-700 dark:text-gray-300", config.wide && "sm:col-span-2")}>
      {config.label}
      <input
        {...register(config.name)}
        type={config.type ?? "text"}
        placeholder={config.placeholder}
        aria-invalid={error ? "true" : undefined}
        className={cn(inputClass, error && "border-red-400 focus:border-red-500 focus:ring-red-500/15")}
      />
      {config.hint ? (
        <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">{config.hint}</span>
      ) : null}
      {error ? <span className="mt-1 block text-xs font-normal text-red-600">{error}</span> : null}
    </label>
  );
}

export function CheckboxField({
  name,
  label,
  register,
}: {
  name: keyof WizardValues;
  label: string;
  register: UseFormRegister<WizardValues>;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-gray-300">
      <input
        {...register(name)}
        type="checkbox"
        className="size-4 rounded border-gray-300 accent-action-600 dark:border-ink-600"
      />
      {label}
    </label>
  );
}
