import { NextRequest, NextResponse } from "next/server";

const BACKEND_ORIGIN = process.env.BACKEND_API_ORIGIN ?? "http://74.50.99.137:8000";
const ALLOWED_PREFIXES = ["api/health", "api/auth/", "api/applications/", "api/clarifications/", "api/audit-logs/"];

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const relativePath = path.join("/");
  if (!ALLOWED_PREFIXES.some((prefix) => relativePath === prefix || relativePath.startsWith(prefix))) {
    return NextResponse.json({ detail: "Backend route is not exposed through the frontend proxy." }, { status: 404 });
  }
  const target = `${BACKEND_ORIGIN}/${relativePath}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();
  const response = await fetch(target, { method: request.method, headers, body, redirect: "manual", cache: "no-store" });
  const output = new NextResponse(response.body, { status: response.status, statusText: response.statusText });
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "content-encoding" && key.toLowerCase() !== "content-length") output.headers.set(key, value);
  });
  return output;
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
export const PUT = forward;
