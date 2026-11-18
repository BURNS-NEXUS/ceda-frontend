// Browser requests must stay same-origin. This intentionally ignores a legacy
// HTTP NEXT_PUBLIC_API_BASE_URL in the browser and uses the Vercel proxy.
const API_BASE_URL = typeof window !== "undefined"
  ? "/api/backend"
  : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend");

export type ApiUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type Application = {
  id: string;
  project_title: string;
  state: string;
  company_no: string;
  incorporation_date: string;
  contact_person: string;
  telephone: string;
  business_nature: string;
  business_location: string;
  loan_amount: number;
  email: string;
};

export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(status: number, details: unknown) { super(`API request failed (${status})`); this.status = status; this.details = details; }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) { let details: unknown = null; try { details = await response.json(); } catch {} throw new ApiError(response.status, details); }
  return response.json() as Promise<T>;
}

export async function getCsrfToken() { await apiFetch("/api/auth/csrf"); return document.cookie.split("; ").find((entry) => entry.startsWith("csrftoken="))?.split("=")[1]; }

export async function mutate<T>(path: string, method: string, body?: unknown) { const csrf = await getCsrfToken(); return apiFetch<T>(path, { method, headers: csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : undefined, body: body === undefined ? undefined : JSON.stringify(body) }); }

export async function login(email: string, password: string) {
  return mutate<ApiUser>("/api/auth/login", "POST", { email, password });
}

export function getCurrentUser() {
  return apiFetch<ApiUser>("/api/auth/me");
}

export function createApplication(payload: Record<string, unknown>) {
  return mutate<Application>("/api/applications/", "POST", payload);
}

export function listApplications() {
  return apiFetch<{ total: number; data: Application[] }>("/api/applications/");
}

export function submitApplication(applicationId: string) {
  return mutate<Application>(`/api/applications/${applicationId}/wf/submit`, "POST");
}

export function updateApplication(id: string, payload: Record<string, unknown>) { return mutate<Application>(`/api/applications/${id}`, "PATCH", payload); }
export function deleteApplication(id: string) { return mutate<Record<string, unknown>>(`/api/applications/${id}`, "DELETE"); }
export function requestClarification(id: string, reason: string) { return mutate<Application>(`/api/applications/${id}/wf/feedback`, "POST", { reason }); }
export function respondToClarification(id: string, response: string) { return mutate<Record<string, unknown>>(`/api/clarifications/${id}/respond`, "POST", { response }); }
export function listClarifications(applicationId?: string) { return apiFetch<{ total: number; data: unknown[] }>(`/api/clarifications/${applicationId ? `?application_id=${applicationId}` : ""}`); }
export function listAuditLogs() { return apiFetch<{ total: number; data: unknown[] }>("/api/audit-logs/"); }

// Proposed handoff endpoints are kept in one place so screens can opt into them
// as Django Ninja routes are delivered, without duplicating URL or permission logic.
export const handoffApi = {
  permissions: () => apiFetch<{ permissions: string[] }>("/api/me/permissions"),
  programmes: () => apiFetch<unknown[]>("/api/programmes/"),
  timeline: (id: string) => apiFetch<unknown[]>(`/api/applications/${id}/timeline`),
  completeness: (id: string) => apiFetch<unknown>(`/api/applications/${id}/completeness`),
  documents: (id: string) => apiFetch<unknown[]>(`/api/applications/${id}/documents`),
  reviews: () => apiFetch<unknown[]>("/api/reviews/assigned"),
  adjudication: (id: string) => apiFetch<unknown>(`/api/applications/${id}/adjudication`),
  feedback: (id: string) => apiFetch<unknown[]>(`/api/applications/${id}/feedback`),
  notifications: () => apiFetch<unknown[]>("/api/notifications/"),
  reports: () => apiFetch<unknown>("/api/reports/overview"),
};
