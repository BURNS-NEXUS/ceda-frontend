import { z } from "zod";
import type {
  AddressIn,
  ApplicationIn,
  CommercialBankerIn,
  ContactIn,
  CorporateDetailsIn,
  EmploymentIn,
  LoanIn,
  NextOfKinIn,
  PersonalDetailsIn,
  ReferenceIn,
  ShareholderIn,
} from "@/lib/api/client";

export const wizardSchema = z.object({
  project_title: z.string(),
  application_type: z.enum(["individual", "company", "all"]),
  company_no: z.string(),
  incorporation_date: z.string(),
  contact_person: z.string(),
  telephone: z.string(),
  business_nature: z.string(),
  business_location: z.string(),
  loan_amount: z.string(),
  email: z.string(),
  has_current_loan_with_other: z.boolean(),
  has_past_loan_with_other: z.boolean(),
  personal_title: z.string(),
  personal_surname: z.string(),
  personal_other_names: z.string(),
  personal_id_number: z.string(),
  personal_date_of_birth: z.string(),
  personal_marital_status: z.string(),
  postal_address: z.string(),
  physical_address: z.string(),
  duration_of_stay: z.string(),
  contact_type: z.string(),
  contact_value: z.string(),
  contact_email: z.string(),
  employer_name: z.string(),
  employer_address: z.string(),
  job_title: z.string(),
  salary_per_month: z.string(),
  training_experience: z.string(),
  project_description: z.string(),
  ever_applied_for_loan: z.boolean(),
  loan_amount_requested: z.string(),
  name_of_company: z.string(),
  date_of_incorporation: z.string(),
  nature_of_company: z.string(),
  shareholder_name: z.string(),
  shareholder_dob: z.string(),
  shareholder_nationality: z.string(),
  shareholder_id_number: z.string(),
  shareholder_position: z.string(),
  shareholder_authorized_capital: z.string(),
  shareholder_issued_capital: z.string(),
  reference_name: z.string(),
  reference_postal_address: z.string(),
  reference_cell_phone: z.string(),
  bank_name: z.string(),
  bank_account_number: z.string(),
  bank_address: z.string(),
  bank_branch: z.string(),
  bank_cell_phone: z.string(),
  accountant: z.string(),
  accountant_company: z.string(),
  accountant_contact: z.string(),
  accountant_contact_address: z.string(),
  accountant_contact_cell: z.string(),
  next_of_kin_name: z.string(),
  next_of_kin_relationship: z.string(),
  next_of_kin_id_number: z.string(),
  next_of_kin_postal_address: z.string(),
  next_of_kin_physical_address: z.string(),
  next_of_kin_cell_phone: z.string(),
  loan_institution: z.string(),
  loan_account_number: z.string(),
  loan_amount_value: z.string(),
  loan_repayment_amount: z.string(),
  loan_repayment_period: z.string(),
  loan_amount_outstanding: z.string(),
  loan_is_past: z.boolean(),
});

export type WizardValues = z.infer<typeof wizardSchema>;

export const emptyWizardValues: WizardValues = {
  project_title: "",
  application_type: "individual",
  company_no: "",
  incorporation_date: "",
  contact_person: "",
  telephone: "",
  business_nature: "",
  business_location: "",
  loan_amount: "0",
  email: "",
  has_current_loan_with_other: false,
  has_past_loan_with_other: false,
  personal_title: "",
  personal_surname: "",
  personal_other_names: "",
  personal_id_number: "",
  personal_date_of_birth: "",
  personal_marital_status: "",
  postal_address: "",
  physical_address: "",
  duration_of_stay: "",
  contact_type: "cell phone",
  contact_value: "",
  contact_email: "",
  employer_name: "",
  employer_address: "",
  job_title: "",
  salary_per_month: "0",
  training_experience: "",
  project_description: "",
  ever_applied_for_loan: false,
  loan_amount_requested: "0",
  name_of_company: "",
  date_of_incorporation: "",
  nature_of_company: "",
  shareholder_name: "",
  shareholder_dob: "",
  shareholder_nationality: "",
  shareholder_id_number: "",
  shareholder_position: "",
  shareholder_authorized_capital: "0",
  shareholder_issued_capital: "0",
  reference_name: "",
  reference_postal_address: "",
  reference_cell_phone: "",
  bank_name: "",
  bank_account_number: "",
  bank_address: "",
  bank_branch: "",
  bank_cell_phone: "",
  accountant: "",
  accountant_company: "",
  accountant_contact: "",
  accountant_contact_address: "",
  accountant_contact_cell: "",
  next_of_kin_name: "",
  next_of_kin_relationship: "",
  next_of_kin_id_number: "",
  next_of_kin_postal_address: "",
  next_of_kin_physical_address: "",
  next_of_kin_cell_phone: "",
  loan_institution: "",
  loan_account_number: "",
  loan_amount_value: "0",
  loan_repayment_amount: "0",
  loan_repayment_period: "1",
  loan_amount_outstanding: "0",
  loan_is_past: false,
};

export const stepFields: (keyof WizardValues)[][] = [
  ["project_title", "company_no", "incorporation_date", "contact_person", "telephone", "business_nature", "business_location", "email"],
  ["personal_title", "personal_surname", "personal_id_number", "postal_address", "physical_address", "contact_value"],
  ["employer_name", "job_title", "name_of_company", "date_of_incorporation"],
  ["reference_name", "next_of_kin_name"],
  [],
];

export function toApplicationIn(values: WizardValues): ApplicationIn {
  return {
    project_title: values.project_title,
    application_type: values.application_type,
    company_no: values.company_no,
    incorporation_date: values.incorporation_date,
    contact_person: values.contact_person,
    telephone: values.telephone,
    business_nature: values.business_nature,
    business_location: values.business_location,
    loan_amount: Number(values.loan_amount) || 0,
    email: values.email,
    has_current_loan_with_other: values.has_current_loan_with_other,
    has_past_loan_with_other: values.has_past_loan_with_other,
  };
}

export function toPersonalDetails(applicationId: string, v: WizardValues): PersonalDetailsIn {
  return {
    application_id: applicationId,
    title: v.personal_title,
    surname: v.personal_surname,
    other_names: v.personal_other_names,
    id_number: v.personal_id_number,
    date_of_birth: v.personal_date_of_birth,
    marital_status: v.personal_marital_status,
  };
}

export function toAddress(applicationId: string, v: WizardValues): AddressIn {
  return {
    application_id: applicationId,
    postal_address: v.postal_address,
    physical_address: v.physical_address,
    duration_of_stay: v.duration_of_stay,
  };
}

export function toContact(applicationId: string, v: WizardValues): ContactIn {
  return {
    application_id: applicationId,
    contact_type: v.contact_type,
    contact_value: v.contact_value,
    email: v.contact_email || v.email,
  };
}

export function toEmployment(applicationId: string, v: WizardValues): EmploymentIn {
  return {
    application_id: applicationId,
    employer_name: v.employer_name,
    employer_address: v.employer_address,
    job_title: v.job_title,
    salary_per_month: v.salary_per_month,
    training_experience: v.training_experience,
    project_description: v.project_description,
    ever_applied_for_loan: v.ever_applied_for_loan,
    loan_amount_requested: v.loan_amount_requested,
  };
}

export function toCorporateDetails(applicationId: string, v: WizardValues): CorporateDetailsIn {
  return {
    application_id: applicationId,
    name_of_company: v.name_of_company,
    date_of_incorporation: v.date_of_incorporation,
    nature_of_company: v.nature_of_company,
  };
}

export function toShareholder(applicationId: string, companyId: string, v: WizardValues): ShareholderIn {
  return {
    application_id: applicationId,
    company_id: companyId,
    name: v.shareholder_name,
    dob: v.shareholder_dob,
    nationality: v.shareholder_nationality,
    id_number: v.shareholder_id_number,
    position: v.shareholder_position,
    total_authorized_share_capital: v.shareholder_authorized_capital,
    total_issued_share_capital: v.shareholder_issued_capital,
  };
}

export function toReference(applicationId: string, v: WizardValues): ReferenceIn {
  return {
    application_id: applicationId,
    name: v.reference_name,
    postal_address: v.reference_postal_address,
    cell_phone: v.reference_cell_phone,
  };
}

export function toCommercialBanker(applicationId: string, v: WizardValues): CommercialBankerIn {
  return {
    application_id: applicationId,
    bank_name: v.bank_name,
    account_number: v.bank_account_number,
    address: v.bank_address,
    branch: v.bank_branch,
    cell_phone: v.bank_cell_phone,
    accountants_auditor: v.accountant,
    company_name: v.accountant_company,
    contact_person: v.accountant_contact,
    contact_person_address: v.accountant_contact_address,
    contact_person_cell_phone: v.accountant_contact_cell,
  };
}

export function toNextOfKin(applicationId: string, v: WizardValues): NextOfKinIn {
  return {
    application_id: applicationId,
    name: v.next_of_kin_name,
    relationship: v.next_of_kin_relationship,
    id_number: v.next_of_kin_id_number,
    postal_address: v.next_of_kin_postal_address,
    physical_address: v.next_of_kin_physical_address,
    cell_phone: v.next_of_kin_cell_phone,
  };
}

export function toLoan(applicationId: string, v: WizardValues): LoanIn {
  return {
    application_id: applicationId,
    institution_name: v.loan_institution,
    account_number: v.loan_account_number,
    loan_amount: v.loan_amount_value,
    repayment_amount: v.loan_repayment_amount,
    repayment_period: Number(v.loan_repayment_period) || 1,
    amount_outstanding: v.loan_amount_outstanding,
    is_past_loan: v.loan_is_past,
  };
}
