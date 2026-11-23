"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  updateApplication,
  type ApplicationDetailOut,
} from "@/lib/api/client";
import { errorMessage } from "../ui/async-state";

const optionalEmail = z
  .string()
  .trim()
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    message: "Please enter a valid email address",
  });

const organisationSchema = z.object({
  contact_person: z.string().trim(),
  email: optionalEmail,
  telephone: z.string().trim(),
  company_no: z.string().trim(),
  incorporation_date: z.string().trim(),
  business_nature: z.string().trim(),
  business_location: z.string().trim(),
});

type OrganisationFormData = z.infer<typeof organisationSchema>;

interface OrganisationEditFormProps {
  detail: ApplicationDetailOut;
  onSaved: () => void;
  onCancel: () => void;
}

export default function OrganisationEditForm({
  detail,
  onSaved,
  onCancel,
}: OrganisationEditFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganisationFormData>({
    resolver: zodResolver(organisationSchema),
    defaultValues: {
      contact_person: detail.contact_person ?? "",
      email: detail.email ?? "",
      telephone: detail.telephone ?? "",
      company_no: detail.company_no ?? "",
      incorporation_date: detail.incorporation_date ?? "",
      business_nature: detail.business_nature ?? "",
      business_location: detail.business_location ?? "",
    },
    mode: "onTouched",
  });

  async function submit(data: OrganisationFormData) {
    setSubmitError(null);
    try {
      await updateApplication(detail.id, data);
      onSaved();
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
        <Field data-invalid={Boolean(errors.contact_person)}>
          <FieldLabel className="mb-1.5 block">Contact person</FieldLabel>
          <Input {...register("contact_person")} />
          <FieldError errors={[errors.contact_person]} />
        </Field>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel className="mb-1.5 block">Email</FieldLabel>
          <Input {...register("email")} type="email" />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={Boolean(errors.telephone)}>
          <FieldLabel className="mb-1.5 block">Telephone</FieldLabel>
          <Input {...register("telephone")} />
          <FieldError errors={[errors.telephone]} />
        </Field>
        <Field data-invalid={Boolean(errors.company_no)}>
          <FieldLabel className="mb-1.5 block">Company number</FieldLabel>
          <Input {...register("company_no")} />
          <FieldError errors={[errors.company_no]} />
        </Field>
        <Field data-invalid={Boolean(errors.incorporation_date)}>
          <FieldLabel className="mb-1.5 block">Incorporation date</FieldLabel>
          <Input {...register("incorporation_date")} placeholder="YYYY-MM-DD" />
          <FieldError errors={[errors.incorporation_date]} />
        </Field>
        <Field data-invalid={Boolean(errors.business_nature)}>
          <FieldLabel className="mb-1.5 block">Business nature</FieldLabel>
          <Input {...register("business_nature")} />
          <FieldError errors={[errors.business_nature]} />
        </Field>
        <Field data-invalid={Boolean(errors.business_location)}>
          <FieldLabel className="mb-1.5 block">Business location</FieldLabel>
          <Input {...register("business_location")} />
          <FieldError errors={[errors.business_location]} />
        </Field>
      </div>
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
