"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch, mutate } from "@/lib/api/client";
import { errorMessage } from "./ui/async-state";

type Schema = { type?: string; title?: string; format?: string; enum?: string[]; anyOf?: Schema[]; properties?: Record<string, Schema>; required?: string[]; $ref?: string; items?: Schema };
type Parameter = { name: string; required?: boolean; in: string; schema: Schema };
type Operation = { summary: string; parameters?: Parameter[]; requestBody?: { content: Record<string, { schema: Schema }> } };
type Contract = { paths: Record<string, Record<string, Operation>>; components: { schemas: Record<string, Schema> } };
const app = "/api/applications/{application_id}";
const tasks = "/api/tasks/";
const reports = "/api/reports/";
const criteria = "/api/scoring-criteria";
const assignments = [tasks, "/api/tasks/{task_id}/assignees", "/api/tasks/{task_id}/conflict-declarations", "/api/tasks/supervisors", "/api/tasks/supervisors/{user_id}", "/api/absentees", "/api/absentees/{absentee_id}"];
export const workflowPaths: Record<string, string[]> = {
  "admin/assignments": assignments,
  "admin/programmes": ["/api/settings", criteria, criteria + "/{criterion_id}", "/api/document-types", "/api/document-types/{document_type_id}"],
  "admin/reports": ["dashboard","pipeline","status-breakdown","processing-time","reviewer-workload","scoring-summary","stalled","audit-trail","export","templates","templates/{template_id}"].map(name => reports + name),
  "admin/adjudication": [tasks, app + "/scoring-summary", app + "/adjudication", app + "/adjudication/confirm"],
  "admin/screening": [tasks, app + "/wf/verify", app + "/wf/feedback"],
  "admin/repository": ["/api/applications/"],
  "adjudicator/queue": [tasks],
  "adjudicator/comparison": [app + "/scoring-summary", app + "/scorings", app + "/scorings/{scoring_id}"],
  "adjudicator/decisions": [app + "/adjudication", app + "/adjudication/confirm"],
  "adjudicator/history": ["/api/audit-logs/"],
};

function resolve(schema: Schema, contract: Contract): Schema {
  if (schema.$ref) return contract.components.schemas[schema.$ref.split("/").pop()!];
  return schema.anyOf?.find(option => option.type !== "null") ?? schema;
}

function Result({ value }: { value: unknown }) {
  if (Array.isArray(value)) return value.length ? <ul className="space-y-2">{value.map((row,i) => <li className="rounded border p-3" key={i}><Result value={row}/></li>)}</ul> : <span>No records</span>;
  if (value && typeof value === "object") return <dl className="grid gap-2">{Object.entries(value).map(([key,v]) => <div key={key}><dt className="font-semibold">{key.replaceAll("_"," ")}</dt><dd><Result value={v}/></dd></div>)}</dl>;
  return <span>{String(value ?? "—")}</span>;
}

export default function WorkflowOperations({ paths }: { paths: string[] }) {
  const [contract,setContract] = useState<Contract>();
  const [choice,setChoice] = useState("");
  const [message,setMessage] = useState("");
  const [result,setResult] = useState<unknown>();
  const [busy,setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    apiFetch<Contract>("/api/openapi.json").then(data => { if(active) setContract(data); }).catch(e => { if(active) setMessage(errorMessage(e)); });
    return () => { active = false; };
  }, []);
  if (!contract) return <p role="status">{message || "Loading available actions…"}</p>;
  const entries = paths.flatMap(path => Object.entries(contract.paths[path] ?? {}).filter(([method]) => {
    if (path === "/api/applications/") return method === "get";
    if (path === criteria && paths[0] !== "/api/settings") return method === "get";
    return ["get","put","post","patch","delete"].includes(method);
  }).map(([method,op]) => ({ path, method, op, key: method + path })));
  const selected = entries.find(item => item.key === choice) ?? entries[0];
  if (!selected) return <p>No actions are published for this workflow.</p>;
  const {path,method,op} = selected;
  const body = resolve(op.requestBody?.content["application/json"]?.schema ?? {}, contract);
  const fields = [...(op.parameters ?? []), ...Object.entries(body.properties ?? {}).map(([name,schema]) => ({ name, schema, in:"body", required: body.required?.includes(name) }))];
  return <section className="space-y-4 rounded-xl border p-5">
    <label className="grid gap-1">Action<select disabled={busy} value={selected.key} onChange={e => {setChoice(e.target.value);setMessage("");setResult(undefined);}}>{entries.map(item => <option key={item.key} value={item.key}>{item.op.summary} ({item.method.toUpperCase()})</option>)}</select></label>
    <form key={selected.key} className="grid gap-3" onSubmit={async e => {
      e.preventDefault();
      if (busy) return;
      const data = new FormData(e.currentTarget);
      const payload: Record<string, unknown> = {};
      const query = new URLSearchParams();
      let url = path;
      setMessage("");setResult(undefined);setBusy(true);
      try {
        for (const field of fields) {
          const raw = String(data.get(field.in + field.name) ?? "").trim();
          if(!raw) continue;
          const schema = resolve(field.schema,contract);
          if(field.in === "path") url = url.replace("{"+field.name+"}",encodeURIComponent(raw));
          else if(field.in === "query") {
            for(const item of schema.type === "array" ? raw.split(",") : [raw]) query.append(field.name,item.trim());
          } else payload[field.name] = ["array","object"].includes(schema.type ?? "") ? JSON.parse(raw) : schema.type === "boolean" ? raw === "true" : ["number","integer"].includes(schema.type ?? "") ? Number(raw) : raw;
        }
        if(query.size) url += "?" + query;
        if(method === "get" && path === "/api/reports/export"){window.location.assign("/api/backend"+url);return;}
        const response = method === "get" ? await apiFetch(url) : await mutate(url,method.toUpperCase(),op.requestBody ? payload : undefined);
        setResult(response);setMessage("Request completed.");
      } catch(e) {
        const detail = e instanceof ApiError && e.details && typeof e.details === "object" && "detail" in e.details ? e.details.detail : undefined;
        if (method === "get" && e instanceof ApiError && e.status === 404 && detail === "Adjudication not found") {
          setMessage("No decision has been recorded for this application yet.");
        } else setMessage(errorMessage(e));
      } finally {setBusy(false);}
    }}>
      {fields.map(field => {
        const schema = resolve(field.schema,contract);
        const name = field.in + field.name;
        const options = schema.enum ?? (schema.type === "boolean" ? ["true","false"] : undefined);
        return <label className="grid gap-1" key={name}>{field.name.replaceAll("_"," ")}{field.required ? " *" : ""}
          {options ? <select name={name} required={field.required}><option value="">Select</option>{options.map(v => <option key={v}>{v}</option>)}</select>
          : ["array","object"].includes(schema.type ?? "") && field.in === "body" ? <textarea name={name} required={field.required} placeholder={field.name === "scores" ? '[{"criterion_id":1,"score":3,"comment":"Review notes"}]' : "Enter JSON"}/>
          : <input name={name} required={field.required} type={schema.format === "date" ? "date" : ["number","integer"].includes(schema.type ?? "") ? "number" : "text"} step={schema.type === "integer" ? 1 : "any"} />}
        </label>;
      })}
      {method === "delete" && <label><input type="checkbox" required/> Confirm deletion of this record</label>}
      <button disabled={busy} className="rounded bg-brand-600 p-2 text-white">{busy ? "Working…" : op.summary}</button>
    </form><p role="status">{message}</p>{result !== undefined && <Result value={result}/>}
  </section>;
}
