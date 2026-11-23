"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateCurrentUser, type UserOut } from "@/lib/api/client";
import { errorMessage } from "../ui/async-state";

const accountSchema = z.object({
  first_name: z.string().trim().max(150, "Too long"),
  last_name: z.string().trim().max(150, "Too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountEditFormProps {
  user: UserOut;
  onSaved: (user: UserOut) => void;
  onCancel: () => void;
}

export default function AccountEditForm({
  user,
  onSaved,
  onCancel,
}: AccountEditFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
    },
    mode: "onTouched",
  });

  async function submit(data: AccountFormData) {
    setSubmitError(null);
    try {
      onSaved(await updateCurrentUser(data));
    } catch (caught) {
      setSubmitError(errorMessage(caught));
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {submitError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {submitError}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.first_name)}>
          <FieldLabel className="mb-1.5 block">First name</FieldLabel>
          <Input
            {...register("first_name")}
            aria-invalid={errors.first_name ? "true" : undefined}
          />
          <FieldError errors={[errors.first_name]} />
        </Field>
        <Field data-invalid={Boolean(errors.last_name)}>
          <FieldLabel className="mb-1.5 block">Last name</FieldLabel>
          <Input
            {...register("last_name")}
            aria-invalid={errors.last_name ? "true" : undefined}
          />
          <FieldError errors={[errors.last_name]} />
        </Field>
      </div>
      <Field data-invalid={Boolean(errors.email)}>
        <FieldLabel className="mb-1.5 block">Email</FieldLabel>
        <Input
          {...register("email")}
          type="email"
          aria-invalid={errors.email ? "true" : undefined}
        />
        <FieldError errors={[errors.email]} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
