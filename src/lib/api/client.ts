import type {
  AddressIn,
  AddressOut,
  AddressPatch,
  ApplicationDetailOut,
  ApplicationFilters,
  ApplicationIn,
  ApplicationOut,
  ApplicationPatch,
  ApplicationDocumentOut,
  AuditLogOut,
  ClarificationFilters,
  ClarificationOut,
  CommercialBankerIn,
  CommercialBankerOut,
  CommercialBankerPatch,
  ContactIn,
  ContactOut,
  ContactPatch,
  CorporateDetailsIn,
  CorporateDetailsOut,
  CorporateDetailsPatch,
  DeleteResult,
  DocumentDecisionIn,
  DocumentTypeIn,
  DocumentTypeOut,
  DocumentTypePatch,
  EmploymentIn,
  EmploymentOut,
  EmploymentPatch,
  FeedbackApplicationIn,
  ListOut,
  LoanIn,
  LoanOut,
  LoanPatch,
  LoginIn,
  NextOfKinIn,
  NextOfKinOut,
  NextOfKinPatch,
  PersonalDetailsIn,
  PersonalDetailsOut,
  PersonalDetailsPatch,
  ReferenceIn,
  ReferenceOut,
  ReferencePatch,
  RegisterIn,
  RequiredDocumentOut,
  ShareholderIn,
  ShareholderOut,
  ShareholderPatch,
  UserOut,
  UserPermissionsOut,
} from "./types";

export * from "./types";

// Browser requests stay same-origin so the session cookie is sent first-party.
const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api/backend"
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend");

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(status: number, details: unknown) {
    const messages: Record<number, string> = {
      401: "Please sign in to continue (401).",
      403: "The server denied this request (403).",
      404: "The requested resource could not be found (404).",
      422: "The server could not validate the submitted fields (422).",
      500: "The API encountered an internal error (500).",
      502: "The portal gateway could not get a valid response from the API (502).",
      503: "The service is temporarily unavailable (503).",
      504: "The gateway timed out waiting for the API (504).",
    };
    super(messages[status] ?? `API request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function buildQuery(params: Record<string, unknown> = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)));
    } else {
      search.append(key, String(value));
    }
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const isForm =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const raw = await response.text();
  let parsed: unknown = raw;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Keep the raw body for non-JSON error responses.
    }
  }

  if (!response.ok) throw new ApiError(response.status, parsed);
  return parsed as T;
}

export async function getCsrfToken(): Promise<string | undefined> {
  await apiFetch<unknown>("/api/auth/csrf");
  const token = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("csrftoken="))
    ?.split("=")[1];
  return token ? decodeURIComponent(token) : undefined;
}

export async function mutate<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const csrf = await getCsrfToken();
  return apiFetch<T>(path, {
    method,
    headers: csrf ? { "X-CSRFToken": csrf } : undefined,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function mutateForm<T>(
  path: string,
  method: string,
  body: FormData,
): Promise<T> {
  const csrf = await getCsrfToken();
  return apiFetch<T>(path, {
    method,
    headers: csrf ? { "X-CSRFToken": csrf } : undefined,
    body,
  });
}

/* ---------------------------------- Auth ---------------------------------- */

export function checkHealth() {
  return apiFetch<Record<string, unknown>>("/api/health");
}

export function register(payload: RegisterIn) {
  return mutate<UserOut>("/api/auth/register", "POST", payload);
}

export function login(email: string, password: string) {
  return mutate<UserOut>("/api/auth/login", "POST", { email, password } satisfies LoginIn);
}

export function logout() {
  return mutate<Record<string, unknown>>("/api/auth/logout", "POST");
}

export function getCurrentUser() {
  return apiFetch<UserOut>("/api/auth/me");
}

export function getMyPermissions() {
  return apiFetch<UserPermissionsOut>("/api/me/permissions");
}

/* ------------------------------- Applications ----------------------------- */

export function createApplication(payload: ApplicationIn) {
  return mutate<ApplicationOut>("/api/applications/", "POST", payload);
}

export function listApplications(filters: ApplicationFilters = {}) {
  return apiFetch<ListOut<ApplicationOut>>(
    `/api/applications/${buildQuery(filters as Record<string, unknown>)}`,
  );
}

export function getApplication(applicationId: string) {
  return apiFetch<ApplicationDetailOut>(`/api/applications/${applicationId}`);
}

export function updateApplication(applicationId: string, payload: ApplicationPatch) {
  return mutate<ApplicationOut>(`/api/applications/${applicationId}`, "PATCH", payload);
}

export function deleteApplication(applicationId: string) {
  return mutate<Record<string, unknown>>(`/api/applications/${applicationId}`, "DELETE");
}

export function submitApplication(applicationId: string) {
  return mutate<ApplicationOut>(`/api/applications/${applicationId}/wf/submit`, "POST");
}

export function resubmitApplication(applicationId: string) {
  return mutate<ApplicationOut>(`/api/applications/${applicationId}/wf/resubmit`, "POST");
}

export function requestClarification(applicationId: string, reason: string) {
  return mutate<ApplicationOut>(
    `/api/applications/${applicationId}/wf/feedback`,
    "POST",
    { reason } satisfies FeedbackApplicationIn,
  );
}

/* -------------------------- Clarifications + audit ------------------------ */

export function listClarifications(filters: ClarificationFilters = {}) {
  return apiFetch<ListOut<ClarificationOut>>(
    `/api/clarifications/${buildQuery(filters as Record<string, unknown>)}`,
  );
}

export function listAuditLogs(options: { skip?: number; take?: number } = {}) {
  return apiFetch<ListOut<AuditLogOut>>(
    `/api/audit-logs/${buildQuery(options as Record<string, unknown>)}`,
  );
}

/** Not part of the confirmed OpenAPI contract — retained for the demo workflow. */
export function respondToClarification(id: string, response: string) {
  return mutate<Record<string, unknown>>(`/api/clarifications/${id}/respond`, "POST", {
    response,
  });
}

/* ---------------------- Generic applicant-detail resources ---------------- */

export type ResourceApi<Out, In, Patch> = {
  list: (applicationId?: string) => Promise<ListOut<Out>>;
  get: (recordId: string) => Promise<Out>;
  create: (payload: In) => Promise<Out>;
  update: (recordId: string, payload: Patch) => Promise<Out>;
  remove: (recordId: string) => Promise<DeleteResult>;
};

function createResourceApi<Out, In, Patch>(path: string): ResourceApi<Out, In, Patch> {
  return {
    list: (applicationId) =>
      apiFetch<ListOut<Out>>(`${path}${buildQuery({ application_id: applicationId })}`),
    get: (recordId) => apiFetch<Out>(`${path}/${recordId}`),
    create: (payload) => mutate<Out>(path, "POST", payload),
    update: (recordId, payload) => mutate<Out>(`${path}/${recordId}`, "PATCH", payload),
    remove: (recordId) => mutate<DeleteResult>(`${path}/${recordId}`, "DELETE"),
  };
}

export const personalDetailsApi = createResourceApi<
  PersonalDetailsOut,
  PersonalDetailsIn,
  PersonalDetailsPatch
>("/api/personal-details");
export const addressApi = createResourceApi<AddressOut, AddressIn, AddressPatch>(
  "/api/address",
);
export const contactApi = createResourceApi<ContactOut, ContactIn, ContactPatch>(
  "/api/contact",
);
export const employmentApi = createResourceApi<
  EmploymentOut,
  EmploymentIn,
  EmploymentPatch
>("/api/employment");
export const corporateDetailsApi = createResourceApi<
  CorporateDetailsOut,
  CorporateDetailsIn,
  CorporateDetailsPatch
>("/api/corporate-details");
export const shareholderApi = createResourceApi<
  ShareholderOut,
  ShareholderIn,
  ShareholderPatch
>("/api/shareholders");
export const referenceApi = createResourceApi<ReferenceOut, ReferenceIn, ReferencePatch>(
  "/api/references",
);
export const commercialBankerApi = createResourceApi<
  CommercialBankerOut,
  CommercialBankerIn,
  CommercialBankerPatch
>("/api/commercial-bankers");
export const nextOfKinApi = createResourceApi<
  NextOfKinOut,
  NextOfKinIn,
  NextOfKinPatch
>("/api/next-of-kin");
export const loanApi = createResourceApi<LoanOut, LoanIn, LoanPatch>("/api/loans");

/* -------------------------------- Documents -------------------------------- */

export const documentTypesApi = {
  list: (includeInactive = false) =>
    apiFetch<DocumentTypeOut[]>(
      `/api/document-types${buildQuery({ include_inactive: includeInactive })}`,
    ),
  get: (documentTypeId: string) =>
    apiFetch<DocumentTypeOut>(`/api/document-types/${documentTypeId}`),
  create: (payload: DocumentTypeIn) =>
    mutate<DocumentTypeOut>("/api/document-types", "POST", payload),
  update: (documentTypeId: string, payload: DocumentTypePatch) =>
    mutate<DocumentTypeOut>(`/api/document-types/${documentTypeId}`, "PATCH", payload),
  delete: (documentTypeId: string) =>
    mutate<DeleteResult>(`/api/document-types/${documentTypeId}`, "DELETE"),
};

export const documentsApi = {
  list: (applicationId: string) =>
    apiFetch<ListOut<ApplicationDocumentOut>>(
      `/api/applications/${applicationId}/documents`,
    ),
  required: (applicationId: string) =>
    apiFetch<ListOut<RequiredDocumentOut>>(
      `/api/applications/${applicationId}/documents/required`,
    ),
  get: (applicationId: string, documentId: string) =>
    apiFetch<ApplicationDocumentOut>(
      `/api/applications/${applicationId}/documents/${documentId}`,
    ),
  upload: (
    applicationId: string,
    payload: { file: File; document_type_id: string; file_description?: string },
  ) => {
    const form = new FormData();
    form.append("file", payload.file);
    form.append("document_type_id", payload.document_type_id);
    form.append("file_description", payload.file_description ?? "");
    return mutateForm<ApplicationDocumentOut>(
      `/api/applications/${applicationId}/documents`,
      "POST",
      form,
    );
  },
  update: (
    applicationId: string,
    documentId: string,
    payload: { file?: File; file_description?: string | null },
  ) => {
    const form = new FormData();
    if (payload.file) form.append("file", payload.file);
    if (payload.file_description !== undefined) {
      form.append("file_description", payload.file_description ?? "");
    }
    return mutateForm<ApplicationDocumentOut>(
      `/api/applications/${applicationId}/documents/${documentId}`,
      "PATCH",
      form,
    );
  },
  delete: (applicationId: string, documentId: string) =>
    mutate<DeleteResult>(
      `/api/applications/${applicationId}/documents/${documentId}`,
      "DELETE",
    ),
  decide: (
    applicationId: string,
    documentId: string,
    payload: DocumentDecisionIn,
  ) =>
    mutate<ApplicationDocumentOut>(
      `/api/applications/${applicationId}/documents/${documentId}/decision`,
      "POST",
      payload,
    ),
};

/* ----------------------------- Convenience API ---------------------------- */

export const api = {
  auth: {
    register,
    login,
    logout,
    me: getCurrentUser,
    permissions: getMyPermissions,
  },
  applications: {
    list: listApplications,
    get: getApplication,
    create: createApplication,
    update: updateApplication,
    remove: deleteApplication,
    submit: submitApplication,
    resubmit: resubmitApplication,
    feedback: requestClarification,
  },
  clarifications: { list: listClarifications },
  audit: { list: listAuditLogs },
  personalDetails: personalDetailsApi,
  addresses: addressApi,
  contacts: contactApi,
  employment: employmentApi,
  corporateDetails: corporateDetailsApi,
  shareholders: shareholderApi,
  references: referenceApi,
  commercialBankers: commercialBankerApi,
  nextOfKin: nextOfKinApi,
  loans: loanApi,
  documentTypes: documentTypesApi,
  documents: documentsApi,
};

/**
 * Endpoints listed in the product handoff but NOT present in the confirmed
 * OpenAPI contract. Kept so demo screens can opt in without duplicating URLs;
 * they must not be presented as live backend data.
 */
export const handoffApi = {
  permissions: getMyPermissions,
  programmes: () => apiFetch<unknown[]>("/api/programmes/"),
  timeline: (id: string) => apiFetch<unknown[]>(`/api/applications/${id}/timeline`),
  completeness: (id: string) => apiFetch<unknown>(`/api/applications/${id}/completeness`),
  reviews: () => apiFetch<unknown[]>("/api/reviews/assigned"),
  adjudication: (id: string) => apiFetch<unknown>(`/api/applications/${id}/adjudication`),
  feedback: (id: string) => apiFetch<unknown[]>(`/api/applications/${id}/feedback`),
  notifications: () => apiFetch<unknown[]>("/api/notifications/"),
  reports: () => apiFetch<unknown>("/api/reports/overview"),
};
