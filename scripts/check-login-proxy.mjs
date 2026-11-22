import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import { NextRequest } from "next/server.js";

const file = new URL("../src/app/api/backend/[...path]/route.ts", import.meta.url);
const compiled = ts.transpileModule(readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const handlers = {};
new Function("exports", "require", compiled.outputText)(handlers, createRequire(file));
const upstream = new Headers();
upstream.append("Set-Cookie", "sessionid=test-session; Domain=backend.example; Path=/api; HttpOnly; Secure");
upstream.append("Set-Cookie", "csrftoken=test-csrf; Path=/; SameSite=Lax");
globalThis.fetch = async () => new Response("{}", { headers: upstream });
const result = await handlers.POST(new NextRequest("https://portal.example/api/backend/api/auth/login", { method: "POST" }), {
  params: Promise.resolve({ path: ["api", "auth", "login"] }),
});
assert.deepEqual(result.headers.getSetCookie(), [
  "sessionid=test-session; Path=/; HttpOnly; Secure",
  "csrftoken=test-csrf; Path=/; SameSite=Lax",
]);
assert.equal(result.headers.get("Cache-Control"), "private, no-store");
console.log("Login proxy preserved both cookies");
