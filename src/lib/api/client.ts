const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://74.50.99.137:8000";

export type ApiUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
};

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  await apiFetch("/api/auth/csrf");
  const csrf = document.cookie.split("; ").find((entry) => entry.startsWith("csrftoken="))?.split("=")[1];
  return apiFetch<ApiUser>("/api/auth/login", {
    method: "POST",
    headers: csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : undefined,
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser() {
  return apiFetch<ApiUser>("/api/auth/me");
}

export function createApplication(payload: Record<string, unknown>) {
  return apiFetch("/api/applications/", { method: "POST", body: JSON.stringify(payload) });
}
