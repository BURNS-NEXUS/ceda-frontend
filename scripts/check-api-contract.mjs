import assert from "node:assert/strict";

const url = "https://ceda-api.bawetsi.com/api/openapi.json";
const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
assert.equal(response.status, 200, "OpenAPI must be reachable");
const { paths, components } = await response.json();
const application = "/api/applications/{application_id}";
const checks = {
  "/api/auth/csrf": ["get"],
  "/api/auth/login": ["post"],
  "/api/auth/me": ["get"],
  "/api/applications/": ["get", "post"],
  [application]: ["get", "patch"],
  [application + "/documents"]: ["get", "post"],
  [application + "/documents/required"]: ["get"],
  [application + "/documents/{document_id}/decision"]: ["post"],
  [application + "/wf/submit"]: ["post"],
  [application + "/wf/verify"]: ["post"],
  "/api/scoring-criteria": ["get"],
  [application + "/scorings/me"]: ["get", "put"],
  [application + "/scorings/me/confirm"]: ["post"],
  [application + "/adjudication"]: ["get", "put"],
  [application + "/adjudication/confirm"]: ["post"],
};
for (const [path, methods] of Object.entries(checks)) {
  for (const method of methods) assert.ok(paths[path]?.[method], method + " " + path);
}
const upload = paths[application + "/documents"].post.requestBody.content["multipart/form-data"].schema;
for (const key of ["file", "document_type_id"]) assert.ok(upload.required.includes(key), key);
assert.equal(upload.properties.file.format, "binary");
assert.equal(components.securitySchemes.SessionAuth.name, "sessionid");
const filter = paths["/api/clarifications/"].get.parameters.find(p => p.name === "application_id").schema;
const idType = components.schemas.ApplicationOut.properties.id.type;
assert.ok((filter.anyOf ?? [filter]).some(s => s.type === idType),
  "Clarification filter must accept the application ID returned by Django (" + idType + ")");
console.log("Production workflow contract passed");
