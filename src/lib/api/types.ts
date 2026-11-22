/**
 * Types generated from the NinjaAPI OpenAPI 3.1 contract.
 * Field names intentionally mirror Django exactly (snake_case).
 */

export type Money = number | string;
export type ListOut<T> = { total: number; data: T[] };
/** Every field optional and nullable — matches the generated Django patch schemas. */
export type NullablePartial<T> = { [K in keyof T]?: T[K] | null };

/* ---------------------------------- Auth --------------------------------- */

export type UserOut = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type RegisterIn = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type LoginIn = { email: string; password: string };

export type UserPermissionsOut = {
  user_id: string;
  username: string;
  is_superuser: boolean;
  permissions: string[];
};

/* ------------------------------- Applications ----------------------------- */

export type ApplicationFilters = {
  skip?: number;
  take?: number | null;
  search?: string | null;
  status_in?: string[] | null;
  status_not_in?: string[] | null;
  created_at_eq?: string | null;
  created_at_gt?: string | null;
  created_at_gte?: string | null;
  created_at_lt?: string | null;
  created_at_lte?: string | null;
  updated_at_eq?: string | null;
  updated_at_gt?: string | null;
  updated_at_gte?: string | null;
  updated_at_lt?: string | null;
  updated_at_lte?: string | null;
  incorporation_date_eq?: string | null;
  incorporation_date_gt?: string | null;
  incorporation_date_gte?: string | null;
  incorporation_date_lt?: string | null;
  incorporation_date_lte?: string | null;
  loan_amount_eq?: Money | null;
  loan_amount_gt?: Money | null;
  loan_amount_gte?: Money | null;
  loan_amount_lt?: Money | null;
  loan_amount_lte?: Money | null;
};

export type ApplicationFields = {
  project_title: string;
  application_type: "individual" | "company" | "all";
  company_no: string;
  incorporation_date: string;
  contact_person: string;
  telephone: string;
  business_nature: string;
  business_location: string;
  loan_amount: number;
  email: string;
  has_current_loan_with_other: boolean;
  has_past_loan_with_other: boolean;
};

export type ApplicationOut = ApplicationFields & { id: string; state: string };
export type ApplicationIn = ApplicationFields;
export type ApplicationPatch = NullablePartial<ApplicationFields>;
export type FeedbackApplicationIn = { reason: string };

/* -------------------------- Applicant detail records ---------------------- */

type RecordMeta = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type PersonalDetailsFields = {
  title: string;
  surname: string;
  other_names: string;
  id_number: string;
  date_of_birth: string;
  marital_status: string;
};
export type PersonalDetailsOut = PersonalDetailsFields & { application_id: string } & RecordMeta;
export type PersonalDetailsIn = PersonalDetailsFields & { application_id: string };
export type PersonalDetailsPatch = { application_id: string } & NullablePartial<PersonalDetailsFields>;

export type AddressFields = {
  postal_address: string;
  physical_address: string;
  duration_of_stay: string;
};
export type AddressOut = AddressFields & { application_id: string } & RecordMeta;
export type AddressIn = AddressFields & { application_id: string };
export type AddressPatch = { application_id: string } & NullablePartial<AddressFields>;

export type ContactFields = {
  contact_type: string;
  contact_value: string;
  email: string;
};
export type ContactOut = ContactFields & { application_id: string } & RecordMeta;
export type ContactIn = ContactFields & { application_id: string };
export type ContactPatch = { application_id: string } & NullablePartial<ContactFields>;

export type EmploymentFields = {
  employer_name: string;
  employer_address: string;
  job_title: string;
  salary_per_month: Money;
  training_experience: string;
  project_description: string;
  ever_applied_for_loan: boolean;
  loan_amount_requested: Money;
};
export type EmploymentOut = EmploymentFields & { application_id: string } & RecordMeta;
export type EmploymentIn = EmploymentFields & { application_id: string };
export type EmploymentPatch = { application_id: string } & NullablePartial<EmploymentFields>;

export type CorporateDetailsFields = {
  name_of_company: string;
  date_of_incorporation: string;
  nature_of_company: string;
};
export type CorporateDetailsOut = CorporateDetailsFields & { application_id: string } & RecordMeta;
export type CorporateDetailsIn = CorporateDetailsFields & { application_id: string };
export type CorporateDetailsPatch = { application_id: string } & NullablePartial<CorporateDetailsFields>;

export type ShareholderFields = {
  company_id: string;
  name: string;
  dob: string;
  nationality: string;
  id_number: string;
  position: string;
  total_authorized_share_capital: Money;
  total_issued_share_capital: Money;
};
export type ShareholderOut = ShareholderFields & { application_id: string } & RecordMeta;
export type ShareholderIn = ShareholderFields & { application_id: string };
export type ShareholderPatch = { application_id: string } & NullablePartial<ShareholderFields>;

export type ReferenceFields = {
  name: string;
  postal_address: string;
  cell_phone: string;
};
export type ReferenceOut = ReferenceFields & { application_id: string } & RecordMeta;
export type ReferenceIn = ReferenceFields & { application_id: string };
export type ReferencePatch = { application_id: string } & NullablePartial<ReferenceFields>;

export type CommercialBankerFields = {
  bank_name: string;
  account_number: string;
  address: string;
  branch: string;
  cell_phone: string;
  accountants_auditor: string;
  company_name: string;
  contact_person: string;
  contact_person_address: string;
  contact_person_cell_phone: string;
};
export type CommercialBankerOut = CommercialBankerFields & { application_id: string } & RecordMeta;
export type CommercialBankerIn = CommercialBankerFields & { application_id: string };
export type CommercialBankerPatch = { application_id: string } & NullablePartial<CommercialBankerFields>;

export type NextOfKinFields = {
  name: string;
  relationship: string;
  id_number: string;
  postal_address: string;
  physical_address: string;
  cell_phone: string;
};
export type NextOfKinOut = NextOfKinFields & { application_id: string } & RecordMeta;
export type NextOfKinIn = NextOfKinFields & { application_id: string };
export type NextOfKinPatch = { application_id: string } & NullablePartial<NextOfKinFields>;

export type LoanFields = {
  institution_name: string;
  account_number: string;
  loan_amount: Money;
  repayment_amount: Money;
  repayment_period: number;
  amount_outstanding: Money;
  is_past_loan: boolean;
};
export type LoanOut = LoanFields & { application_id: string } & RecordMeta;
export type LoanIn = LoanFields & { application_id: string };
export type LoanPatch = { application_id: string } & NullablePartial<LoanFields>;

/* --------------------------- Application detail --------------------------- */

export type EvaluationScoreDetailOut = {
  id: string;
  criterion_id: string;
  score: number;
  comments: string;
};
export type EvaluationDetailOut = {
  id: string;
  evaluator_id: string;
  comments: string;
  created_at: string;
  updated_at: string;
  scores: EvaluationScoreDetailOut[];
};
export type ClarificationDetailOut = {
  id: string;
  version: number;
  reason: string;
  response: string | null;
  created_by_id: string | null;
  created_at: string;
};

export type ApplicationDetailOut = ApplicationOut & {
  personal_details: PersonalDetailsOut[];
  addresses: AddressOut[];
  contacts: ContactOut[];
  employments: EmploymentOut[];
  corporate_details: CorporateDetailsOut[];
  shareholders: ShareholderOut[];
  loans: LoanOut[];
  references: ReferenceOut[];
  commercial_bankers: CommercialBankerOut[];
  next_of_kin: NextOfKinOut[];
  evaluations: EvaluationDetailOut[];
  clarifications: ClarificationDetailOut[];
};

/* -------------------------- Clarifications + audit ------------------------ */

export type ClarificationFilters = {
  skip?: number;
  take?: number | null;
  application_id?: number | null;
  version?: number | null;
};
export type ClarificationOut = {
  id: string;
  created_by: string | null;
  application_id: number;
  version: number;
  reason: string;
  response: string | null;
  created_at: string;
};
export type AuditLogOut = {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: unknown;
  created_at: string;
};

/* -------------------------------- Documents ------------------------------- */

export type DocumentTypeOut = {
  id: string;
  name: string;
  description: string;
  allowed_file_types: string[];
  is_required: boolean;
  is_active: boolean;
};
export type DocumentTypeIn = {
  name: string;
  description?: string;
  allowed_file_types: string[];
  is_required?: boolean;
  is_active?: boolean;
};
export type DocumentTypePatch = NullablePartial<DocumentTypeIn>;
export type DocumentTypeRefOut = { id: string; name: string };
export type RejectedByOut = { id: string; username: string };
export type DocumentDecisionIn = {
  status: "accepted" | "rejected";
  reason?: string | null;
};
export type ApplicationDocumentOut = {
  id: string;
  application_id: string;
  document_type: DocumentTypeRefOut;
  file: string;
  file_description: string;
  status: string;
  reason: string;
  rejected_by?: RejectedByOut | null;
  decision_on?: string | null;
  created_at: string;
  updated_at: string;
};
export type RequiredDocumentOut = DocumentTypeOut & {
  uploaded: boolean;
  document_id?: string | null;
  status?: string | null;
};
export type DeleteResult = { success: boolean };
