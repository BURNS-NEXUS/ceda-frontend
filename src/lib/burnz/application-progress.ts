import type { ApplicationDetailOut, RequiredDocumentOut } from "@/lib/api/client";

export type ChecklistItem = {
  key: string;
  label: string;
  hint: string;
  complete: boolean;
};

/** Completeness derived from the confirmed detail endpoint — no invented backend fields. */
export function applicationChecklist(
  detail: ApplicationDetailOut | null,
  requiredDocuments: RequiredDocumentOut[] = [],
): ChecklistItem[] {
  const coreComplete = Boolean(
    detail?.project_title &&
      detail.company_no &&
      detail.incorporation_date &&
      detail.contact_person &&
      detail.telephone &&
      detail.business_nature &&
      detail.business_location &&
      detail.email,
  );
  const requiredUploaded = requiredDocuments.length
    ? requiredDocuments.every((document) => document.uploaded)
    : false;

  return [
    { key: "project", label: "Project details", hint: "Title, company and loan request", complete: coreComplete },
    { key: "personal", label: "Personal details", hint: "Applicant identity", complete: Boolean(detail?.personal_details.length) },
    { key: "address", label: "Address", hint: "Postal and physical address", complete: Boolean(detail?.addresses.length) },
    { key: "contact", label: "Contact", hint: "Phone and email", complete: Boolean(detail?.contacts.length) },
    { key: "employment", label: "Employment", hint: "Employer and project description", complete: Boolean(detail?.employments.length) },
    { key: "corporate", label: "Business ownership", hint: "Company and shareholders", complete: Boolean(detail?.corporate_details.length && detail.shareholders.length) },
    { key: "references", label: "References", hint: "Personal and professional", complete: Boolean(detail?.references.length && detail.commercial_bankers.length) },
    { key: "nextOfKin", label: "Next of kin", hint: "Emergency contact", complete: Boolean(detail?.next_of_kin.length) },
    { key: "loans", label: "Loan history", hint: "Current and previous financing", complete: Boolean(detail?.loans.length) || Boolean(detail && !detail.has_current_loan_with_other && !detail.has_past_loan_with_other) },
    { key: "documents", label: "Supporting documents", hint: "Required evidence files", complete: requiredUploaded },
  ];
}

export function completionPercentage(items: ChecklistItem[]): number {
  if (!items.length) return 0;
  return Math.round((items.filter((item) => item.complete).length / items.length) * 100);
}
