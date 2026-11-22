"use client";

import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  addressApi,
  commercialBankerApi,
  corporateDetailsApi,
  contactApi,
  createApplication,
  documentsApi,
  employmentApi,
  getApplication,
  loanApi,
  nextOfKinApi,
  personalDetailsApi,
  referenceApi,
  shareholderApi,
  submitApplication,
  updateApplication,
  type ApplicationDetailOut,
  type RequiredDocumentOut,
  type ResourceApi,
} from "@/lib/api/client";
import DocumentManager from "../../documents/document-manager";
import { errorMessage, PanelError, PanelSkeleton } from "../../ui/async-state";
import SaveIndicator, { type SaveState } from "../../ui/save-indicator";
import { CheckboxField, TextField, type FieldConfig } from "./fields";
import {
  emptyWizardValues,
  stepFields,
  toAddress,
  toApplicationIn,
  toCommercialBanker,
  toContact,
  toCorporateDetails,
  toEmployment,
  toLoan,
  toNextOfKin,
  toPersonalDetails,
  toReference,
  toShareholder,
  wizardSchema,
  type WizardValues,
} from "./types";

const steps = ["Project basics", "Applicant", "Business", "Evidence", "Review & submit"];

const fieldGroups: FieldConfig[][] = [
  [
    { name: "project_title", label: "Project title", placeholder: "Solar-powered irrigation system", wide: true, hint: "A short, specific name for the innovation." },
    { name: "company_no", label: "Company registration number", placeholder: "e.g. 2024/123456/07" },
    { name: "incorporation_date", label: "Incorporation date", type: "date" },
    { name: "contact_person", label: "Contact person", placeholder: "Full name" },
    { name: "telephone", label: "Telephone", type: "tel", placeholder: "+27 11 000 0000" },
    { name: "email", label: "Email", type: "email", placeholder: "you@company.co.za" },
    { name: "business_nature", label: "Nature of business", placeholder: "e.g. Clean technology" },
    { name: "business_location", label: "Business location", placeholder: "City, country" },
    { name: "loan_amount", label: "Loan amount requested", type: "number" },
  ],
  [
    { name: "personal_title", label: "Title", placeholder: "Mr / Ms / Dr" },
    { name: "personal_surname", label: "Surname" },
    { name: "personal_other_names", label: "Other names" },
    { name: "personal_id_number", label: "Identity or passport number" },
    { name: "personal_date_of_birth", label: "Date of birth", type: "date" },
    { name: "personal_marital_status", label: "Marital status" },
    { name: "postal_address", label: "Postal address", wide: true },
    { name: "physical_address", label: "Physical address", wide: true },
    { name: "duration_of_stay", label: "Duration at address" },
    { name: "contact_type", label: "Contact type", placeholder: "cell phone" },
    { name: "contact_value", label: "Contact number" },
    { name: "contact_email", label: "Contact email", type: "email" },
  ],
  [
    { name: "employer_name", label: "Employer name" },
    { name: "employer_address", label: "Employer address", wide: true },
    { name: "job_title", label: "Job title" },
    { name: "salary_per_month", label: "Monthly salary", type: "number" },
    { name: "training_experience", label: "Relevant training and experience", wide: true },
    { name: "project_description", label: "Project description", wide: true },
    { name: "loan_amount_requested", label: "Amount previously requested", type: "number" },
    { name: "name_of_company", label: "Registered company name" },
    { name: "date_of_incorporation", label: "Date of incorporation", type: "date" },
    { name: "nature_of_company", label: "Nature of company" },
    { name: "shareholder_name", label: "Shareholder name" },
    { name: "shareholder_dob", label: "Shareholder date of birth", type: "date" },
    { name: "shareholder_nationality", label: "Nationality" },
    { name: "shareholder_id_number", label: "Identity number" },
    { name: "shareholder_position", label: "Position" },
    { name: "shareholder_authorized_capital", label: "Authorised share capital", type: "number" },
    { name: "shareholder_issued_capital", label: "Issued share capital", type: "number" },
  ],
  [
    { name: "reference_name", label: "Personal reference" },
    { name: "reference_postal_address", label: "Reference address" },
    { name: "reference_cell_phone", label: "Reference cell phone" },
    { name: "bank_name", label: "Commercial bank" },
    { name: "bank_account_number", label: "Bank account number" },
    { name: "bank_address", label: "Bank address" },
    { name: "bank_branch", label: "Branch" },
    { name: "bank_cell_phone", label: "Bank contact number" },
    { name: "accountant", label: "Accountant / auditor" },
    { name: "accountant_company", label: "Accountant company" },
    { name: "accountant_contact", label: "Accountant contact person" },
    { name: "accountant_contact_address", label: "Accountant contact address" },
    { name: "accountant_contact_cell", label: "Accountant contact number" },
    { name: "next_of_kin_name", label: "Next of kin" },
    { name: "next_of_kin_relationship", label: "Relationship" },
    { name: "next_of_kin_id_number", label: "Identity number" },
    { name: "next_of_kin_postal_address", label: "Postal address" },
    { name: "next_of_kin_physical_address", label: "Physical address" },
    { name: "next_of_kin_cell_phone", label: "Cell phone" },
    { name: "loan_institution", label: "Lending institution" },
    { name: "loan_account_number", label: "Loan account number" },
    { name: "loan_amount_value", label: "Loan amount", type: "number" },
    { name: "loan_repayment_amount", label: "Repayment amount", type: "number" },
    { name: "loan_repayment_period", label: "Repayment period (months)", type: "number" },
    { name: "loan_amount_outstanding", label: "Amount outstanding", type: "number" },
  ],
  [],
];

const helpCopy = [
  "These details identify the innovation and the financing being requested. They are saved to Django as soon as you pause typing.",
  "We use this to verify the applicant and contact them about the application. Fields are saved independently, so you can leave and return.",
  "Ownership and employment information helps screening understand who is behind the project. Shareholder records are linked to the company record.",
  "Upload the required evidence, then add references and any existing loans. A file is only marked ready after Django confirms the upload.",
  "Review your answers before submitting. Submission freezes the current version and moves the application into screening — you can only edit it again after feedback.",
];

export default function ApplicationWizard({
  applicationId,
  onDone,
}: {
  applicationId?: string;
  onDone: (applicationId: string) => void;
}) {
  const [id, setId] = useState<string | null>(applicationId ?? null);
  const [step, setStep] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(applicationId));
  const [recordIds, setRecordIds] = useState<Record<string, string>>({});
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocumentOut[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const readyRef = useRef(!applicationId);
  const timerRef = useRef<number | undefined>(undefined);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: emptyWizardValues,
    mode: "onBlur",
  });

  useEffect(() => {
    if (!applicationId) return;
    let active = true;
    const load = async () => {
      try {
        const [detail, documents] = await Promise.all([
          getApplication(applicationId),
          documentsApi.required(applicationId),
        ]);
        if (!active) return;
        hydrate(detail);
        setRequiredDocuments(documents.data);
        const ids: Record<string, string> = {};
        const first = <T extends { id: string }>(items: T[]) => items[0]?.id;
        const found: Record<string, string | undefined> = {
          personal: first(detail.personal_details),
          address: first(detail.addresses),
          contact: first(detail.contacts),
          employment: first(detail.employments),
          corporate: first(detail.corporate_details),
          shareholder: first(detail.shareholders),
          reference: first(detail.references),
          banker: first(detail.commercial_bankers),
          nextOfKin: first(detail.next_of_kin),
          loan: first(detail.loans),
        };
        Object.entries(found).forEach(([key, value]) => {
          if (value) ids[key] = value;
        });
        setRecordIds(ids);
      } catch (caught) {
        if (active) setError(errorMessage(caught));
      } finally {
        if (active) {
          setLoading(false);
          readyRef.current = true;
        }
      }
    };
    void load();
    return () => {
      active = false;
    };

    function hydrate(detail: ApplicationDetailOut) {
      reset({
        ...emptyWizardValues,
        project_title: detail.project_title,
        application_type: detail.application_type,
        company_no: detail.company_no,
        incorporation_date: detail.incorporation_date,
        contact_person: detail.contact_person,
        telephone: detail.telephone,
        business_nature: detail.business_nature,
        business_location: detail.business_location,
        loan_amount: String(detail.loan_amount),
        email: detail.email,
        has_current_loan_with_other: detail.has_current_loan_with_other,
        has_past_loan_with_other: detail.has_past_loan_with_other,
        personal_title: detail.personal_details[0]?.title ?? "",
        personal_surname: detail.personal_details[0]?.surname ?? "",
        personal_other_names: detail.personal_details[0]?.other_names ?? "",
        personal_id_number: detail.personal_details[0]?.id_number ?? "",
        personal_date_of_birth: detail.personal_details[0]?.date_of_birth ?? "",
        personal_marital_status: detail.personal_details[0]?.marital_status ?? "",
        postal_address: detail.addresses[0]?.postal_address ?? "",
        physical_address: detail.addresses[0]?.physical_address ?? "",
        duration_of_stay: detail.addresses[0]?.duration_of_stay ?? "",
        contact_type: detail.contacts[0]?.contact_type ?? "",
        contact_value: detail.contacts[0]?.contact_value ?? "",
        contact_email: detail.contacts[0]?.email ?? "",
        employer_name: detail.employments[0]?.employer_name ?? "",
        employer_address: detail.employments[0]?.employer_address ?? "",
        job_title: detail.employments[0]?.job_title ?? "",
        salary_per_month: String(detail.employments[0]?.salary_per_month ?? "0"),
        training_experience: detail.employments[0]?.training_experience ?? "",
        project_description: detail.employments[0]?.project_description ?? "",
        ever_applied_for_loan: detail.employments[0]?.ever_applied_for_loan ?? false,
        loan_amount_requested: String(detail.employments[0]?.loan_amount_requested ?? "0"),
        name_of_company: detail.corporate_details[0]?.name_of_company ?? "",
        date_of_incorporation: detail.corporate_details[0]?.date_of_incorporation ?? "",
        nature_of_company: detail.corporate_details[0]?.nature_of_company ?? "",
        shareholder_name: detail.shareholders[0]?.name ?? "",
        shareholder_dob: detail.shareholders[0]?.dob ?? "",
        shareholder_nationality: detail.shareholders[0]?.nationality ?? "",
        shareholder_id_number: detail.shareholders[0]?.id_number ?? "",
        shareholder_position: detail.shareholders[0]?.position ?? "",
        shareholder_authorized_capital: String(detail.shareholders[0]?.total_authorized_share_capital ?? "0"),
        shareholder_issued_capital: String(detail.shareholders[0]?.total_issued_share_capital ?? "0"),
        reference_name: detail.references[0]?.name ?? "",
        reference_postal_address: detail.references[0]?.postal_address ?? "",
        reference_cell_phone: detail.references[0]?.cell_phone ?? "",
        bank_name: detail.commercial_bankers[0]?.bank_name ?? "",
        bank_account_number: detail.commercial_bankers[0]?.account_number ?? "",
        bank_address: detail.commercial_bankers[0]?.address ?? "",
        bank_branch: detail.commercial_bankers[0]?.branch ?? "",
        bank_cell_phone: detail.commercial_bankers[0]?.cell_phone ?? "",
        accountant: detail.commercial_bankers[0]?.accountants_auditor ?? "",
        accountant_company: detail.commercial_bankers[0]?.company_name ?? "",
        accountant_contact: detail.commercial_bankers[0]?.contact_person ?? "",
        accountant_contact_address: detail.commercial_bankers[0]?.contact_person_address ?? "",
        accountant_contact_cell: detail.commercial_bankers[0]?.contact_person_cell_phone ?? "",
        next_of_kin_name: detail.next_of_kin[0]?.name ?? "",
        next_of_kin_relationship: detail.next_of_kin[0]?.relationship ?? "",
        next_of_kin_id_number: detail.next_of_kin[0]?.id_number ?? "",
        next_of_kin_postal_address: detail.next_of_kin[0]?.postal_address ?? "",
        next_of_kin_physical_address: detail.next_of_kin[0]?.physical_address ?? "",
        next_of_kin_cell_phone: detail.next_of_kin[0]?.cell_phone ?? "",
        loan_institution: detail.loans[0]?.institution_name ?? "",
        loan_account_number: detail.loans[0]?.account_number ?? "",
        loan_amount_value: String(detail.loans[0]?.loan_amount ?? "0"),
        loan_repayment_amount: String(detail.loans[0]?.repayment_amount ?? "0"),
        loan_repayment_period: String(detail.loans[0]?.repayment_period ?? "1"),
        loan_amount_outstanding: String(detail.loans[0]?.amount_outstanding ?? "0"),
        loan_is_past: detail.loans[0]?.is_past_loan ?? false,
      });
    }
  }, [applicationId, reset]);

  const upsert = useCallback(
    async <Out extends { id: string }, In, Patch>(
      api: Pick<ResourceApi<Out, In, Patch>, "create" | "update">,
      key: string,
      payload: In,
    ) => {
      const existingId = recordIds[key];
      const saved = existingId
        ? await api.update(existingId, payload as unknown as Patch)
        : await api.create(payload);
      setRecordIds((current) => ({ ...current, [key]: saved.id }));
      return saved;
    },
    [recordIds],
  );

  const saveStep = useCallback(async (values: WizardValues): Promise<boolean> => {
    if (!readyRef.current) return false;
    setSaveState("saving");
    setError(null);
    try {
      let applicationIdToUse = id;
      if (step === 0) {
        const payload = toApplicationIn(values);
        if (applicationIdToUse) {
          await updateApplication(applicationIdToUse, payload);
        } else {
          const created = await createApplication(payload);
          applicationIdToUse = created.id;
          setId(created.id);
        }
      } else if (!applicationIdToUse) {
        // Project basics are always saved first; guard against a skipped step.
        const created = await createApplication(toApplicationIn(values));
        applicationIdToUse = created.id;
        setId(created.id);
      }

      if (step === 1 && applicationIdToUse) {
        await upsert(personalDetailsApi, "personal", toPersonalDetails(applicationIdToUse, values));
        await upsert(addressApi, "address", toAddress(applicationIdToUse, values));
        await upsert(contactApi, "contact", toContact(applicationIdToUse, values));
      } else if (step === 2 && applicationIdToUse) {
        await upsert(employmentApi, "employment", toEmployment(applicationIdToUse, values));
        const company = await upsert(corporateDetailsApi, "corporate", toCorporateDetails(applicationIdToUse, values));
        if (values.shareholder_name) {
          await upsert(shareholderApi, "shareholder", toShareholder(applicationIdToUse, company.id, values));
        }
      } else if (step === 3 && applicationIdToUse) {
        if (values.reference_name) await upsert(referenceApi, "reference", toReference(applicationIdToUse, values));
        if (values.bank_name) await upsert(commercialBankerApi, "banker", toCommercialBanker(applicationIdToUse, values));
        if (values.next_of_kin_name) await upsert(nextOfKinApi, "nextOfKin", toNextOfKin(applicationIdToUse, values));
        if (values.loan_institution) await upsert(loanApi, "loan", toLoan(applicationIdToUse, values));
      }
      setSaveState("saved");
      return true;
    } catch (caught) {
      setSaveState("error");
      setError(errorMessage(caught));
      return false;
    }
  }, [step, id, upsert]);

  useEffect(() => {
    if (!readyRef.current) return;
    const subscription = watch(() => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void handleSubmit((values) => saveStep(values))();
      }, 900);
    });
    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timerRef.current);
    };
  }, [watch, handleSubmit, saveStep]);

  const goNext = async () => {
    const valid = await trigger(stepFields[step], { shouldFocus: true });
    if (!valid) return;
    window.clearTimeout(timerRef.current);
    const saved = await saveStep(getValues());
    if (saved) setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const submit = async () => {
    if (!id) {
      setError("Save the project details before submitting the application.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitApplication(id);
      setSubmitted(true);
      onDone(id);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PanelSkeleton rows={5} />;
  if (submitted) {
    return (
      <div className="rounded-xl border border-action-200 bg-action-50/60 p-8 text-center dark:border-action-900/50 dark:bg-action-950/30">
        <h2 className="text-lg font-semibold text-ink-800 dark:text-white">Application submitted</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-gray-600 dark:text-gray-300">
          Django has frozen the submitted version and moved the application into screening. You can follow its progress from My applications.
        </p>
        <p className="mt-4 text-xs text-gray-500">Reference {id}</p>
      </div>
    );
  }
  if (error && step === 0 && !id) return <PanelError message={error} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-action-700 dark:text-action-300">
            New application
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink-800 dark:text-white">{steps[step]}</h2>
        </div>
        <div className="flex items-center gap-4">
          <SaveIndicator state={saveState} />
          <span className="text-xs text-gray-500">Step {step + 1} of {steps.length}</span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-ink-800">
        <div
          className="h-1.5 rounded-full bg-action-600 transition-all"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)_220px]">
        <nav className="space-y-1" aria-label="Application sections">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              disabled={index > step}
              onClick={() => setStep(index)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm ${
                index === step
                  ? "bg-action-50 font-medium text-action-700 dark:bg-action-900/30 dark:text-action-300"
                  : "text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5"
              }`}
            >
              <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${index < step ? "bg-action-600 text-white" : "bg-gray-200 text-gray-600 dark:bg-ink-700 dark:text-gray-300"}`}>
                {index < step ? "✓" : index + 1}
              </span>
              {label}
            </button>
          ))}
        </nav>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-ink-700 dark:bg-ink-900/60">
          {error ? (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">{error}</p>
          ) : null}

          {step === 3 && id ? (
            <DocumentManager
              applicationId={id}
              onChanged={() => {
                void documentsApi.required(id).then((result) => setRequiredDocuments(result.data)).catch(() => undefined);
              }}
            />
          ) : null}

          {fieldGroups[step].length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {fieldGroups[step].map((config) => (
                <TextField
                  key={config.name}
                  config={config}
                  register={register}
                  error={errors[config.name]?.message}
                />
              ))}
              {step === 0 ? (
                <>
                  <label className="flex flex-col gap-2">
                    Application type
                    <select {...register("application_type")}>
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                      <option value="all">All</option>
                    </select>
                  </label>
                  <div className="sm:col-span-2">
                    <CheckboxField name="has_current_loan_with_other" label="I currently have a loan with another institution" register={register} />
                  </div>
                  <div className="sm:col-span-2">
                    <CheckboxField name="has_past_loan_with_other" label="I have had a loan with another institution in the past" register={register} />
                  </div>
                </>
              ) : null}
              {step === 2 ? (
                <div className="sm:col-span-2">
                  <CheckboxField name="ever_applied_for_loan" label="I have applied for government assistance before" register={register} />
                </div>
              ) : null}
              {step === 3 ? (
                <div className="sm:col-span-2">
                  <CheckboxField name="loan_is_past" label="This is a historical (repaid) loan" register={register} />
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-canvas p-4 dark:bg-ink-950/40">
                <p className="text-sm font-medium text-ink-800 dark:text-white">{getValues("project_title") || "Untitled application"}</p>
                <p className="mt-1 text-xs text-gray-500">Company {getValues("company_no") || "—"} · Loan {getValues("loan_amount") || "0"}</p>
              </div>
              <ul className="grid gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                <li>Applicant: {getValues("personal_surname") || "—"} {getValues("personal_other_names")}</li>
                <li>Company: {getValues("name_of_company") || "—"}</li>
                <li>Required documents uploaded: {requiredDocuments.filter((item) => item.uploaded).length} / {requiredDocuments.length}</li>
                <li>Contact: {getValues("contact_email") || getValues("email") || "—"}</li>
              </ul>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-ink-800">
            <Button variant="outline" size="sm" disabled={step === 0 || busy} onClick={() => setStep((current) => current - 1)}>
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void handleSubmit((values) => saveStep(values))()}
              >
                {saveState === "saving" ? "Saving…" : "Save draft"}
              </Button>
              {step < steps.length - 1 ? (
                <Button size="sm" onClick={() => void goNext()}>Save &amp; continue</Button>
              ) : (
                <Button size="sm" onClick={() => void submit()} disabled={busy}>
                  {busy ? "Submitting…" : "Submit application"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-gray-200 bg-canvas p-4 dark:border-ink-700 dark:bg-ink-950/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Why we ask</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{helpCopy[step]}</p>
          <div className="mt-4 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-ink-700">
            Changes save to Django automatically. You will only see “Saved” after the backend confirms it.
          </div>
        </aside>
      </div>
    </div>
  );
}
