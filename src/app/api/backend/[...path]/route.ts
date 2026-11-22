import { NextRequest, NextResponse } from "next/server";

const BACKEND_ORIGIN = process.env.BACKEND_API_ORIGIN ?? "http://74.50.99.137:8000";
// Every prefix in the NinjaAPI 3.1 contract. Anything outside this list is
// deliberately blocked so the proxy cannot become an open relay.
const ALLOWED_PREFIXES = [
  "api/health",
  "api/auth/",
  "api/me/permissions",
  "api/tasks",
  "api/scoring-criteria",
  "api/reports",
  "api/applications/",
  "api/clarifications/",
  "api/audit-logs/",
  "api/document-types",
  "api/personal-details",
  "api/address",
  "api/contact",
  "api/employment",
  "api/corporate-details",
  "api/shareholders",
  "api/references",
  "api/commercial-bankers",
  "api/next-of-kin",
  "api/loans",
];

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  // The catch-all param drops a trailing slash, but Django requires one on
  // collection endpoints. Read it from the incoming URL instead.
  const relativePath =
    request.nextUrl.pathname.replace(/^\/api\/backend\//, "") || path.join("/");
  // Django may redirect a trailing-slash URL to its slash-less form (308).
  // Treat both spellings as allowed so a followed redirect is not blocked.
  const normalized = relativePath.replace(/\/+$/, "");
  const isAllowed = ALLOWED_PREFIXES.some((prefix) => {
    const base = prefix.replace(/\/+$/, "");
    return normalized === base || normalized.startsWith(`${base}/`);
  });
  if (!isAllowed) {
    return NextResponse.json({ detail: "Backend route is not exposed through the frontend proxy." }, { status: 404 });
  }
  const target = `${BACKEND_ORIGIN}/${relativePath}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
  // Follow Django's APPEND_SLASH etc. on the backend origin. Passing those
  // redirects through would leak a Location like /api/applications/ into the
  // browser, where /api/backend is missing and the session cookie is wrong.
  const response = await fetch(target, { method: request.method, headers, body, redirect: "follow", cache: "no-store" });
  const output = new NextResponse(response.body, { status: response.status, statusText: response.statusText });
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === "content-encoding" || lowerKey === "content-length") return;
    if (lowerKey === "set-cookie") {
      // The browser is talking to this same-origin proxy, not the private
      // Django host. Remove backend-specific cookie domains and make the
      // session available to all proxied API paths.
      const cookie = value
        .replace(/;\s*Domain=[^;]+/gi, "")
        .replace(/;\s*Path=[^;]+/gi, "; Path=/");
      output.headers.set("set-cookie", cookie.includes("Path=") ? cookie : `${cookie}; Path=/`);
      return;
    }
    output.headers.set(key, value);
  });
  return output;
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
export const PUT = forward;
