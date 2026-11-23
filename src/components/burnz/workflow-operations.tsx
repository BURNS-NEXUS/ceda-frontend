"use client";

import { useEffect, useState } from "react";
import DocumentManager from "./documents/document-manager";
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
  "evaluator/reviews": [tasks, "/api/tasks/{task_id}/conflict-declarations"],
  "evaluator/reviews/workspace": [tasks, criteria, app + "/scorings/me", app + "/scorings/me/confirm"],
  "evaluator/guidelines": [criteria],
  "adjudicator/queue": [tasks],
  "adjudicator/comparison": [app + "/scoring-summary", app + "/scorings", app + "/scorings/{scoring_id}"],
  "adjudicator/decisions": [app + "/adjudication", app + "/adjudication/confirm"],
  "adjudicator/history": ["/api/audit-logs/"],
  "innovator/notifications": ["/api/clarifications/", "/api/applications/", app + "/wf/resubmit"],
  "evaluator/profile": ["/api/auth/me","/api/absentees","/api/absentees/{absentee_id}"],
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

const innovationCriteria = new Set(["Strategic Alignment", "Innovation & Originality", "Impact Potential", "Feasibility & Viability", "Scalability & Sustainability", "Implementation Capacity"]);
type Criterion = {id:number;name:string;max_score:number|string;is_active:boolean;is_required:boolean};
function ScoreFields() {
  const [rows,setRows] = useState<Criterion[]>([]);
  const [status,setStatus] = useState("Loading scoring criteria…");
  useEffect(() => {
    apiFetch<Criterion[]>("/api/scoring-criteria").then(items => {
      const active = items.filter(item => item.is_active);
      setRows(active);
      setStatus(active.length ? "" : "A programme administrator must configure active scoring criteria.");
    }).catch(e => setStatus(errorMessage(e)));
  }, []);
  return <fieldset className="grid gap-3"><legend>Assessment scores</legend>{status && <p role="status">{status}</p>}
    {rows.map(row => <div key={row.id} className="grid gap-2 rounded border p-3">
      <label>{row.name} (0–{row.max_score}) <input name={"score:"+row.id} type="number" min={innovationCriteria.has(row.name) ? 1 : 0} max={row.max_score} step={innovationCriteria.has(row.name) ? 1 : "any"} required={row.is_required}/></label>
      <label>Reviewer comment <input name={"comment:"+row.id}/></label>
    </div>)}
  </fieldset>;
}

export default function WorkflowOperations({ paths }: { paths: string[] }) {
  const evaluatorWorkspace = paths === workflowPaths["evaluator/reviews/workspace"];
  const [applicationId, setApplicationId] = useState("");
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [assignmentStatus, setAssignmentStatus] = useState("Loading assignments...");
  useEffect(() => {
    if (!evaluatorWorkspace) return;
    let active = true;
    apiFetch<{data: {application_id: string; status: string}[]}>("/api/tasks/?task_type=evaluation")
      .then(({data}) => {
        if (!active) return;
        const ids = [...new Set(data.filter(task => ["assigned", "pending"].includes(task.status)).map(task => task.application_id))];
        setAssignedIds(ids);
        setApplicationId(ids[0] ?? "");
        setAssignmentStatus(ids.length ? "" : "No active evaluation assignments.");
      }).catch(error => { if (active) setAssignmentStatus(errorMessage(error)); });
    return () => { active = false; };
  }, [evaluatorWorkspace]);
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
    {evaluatorWorkspace && <section className="grid gap-3">
      <label>Assigned application <select value={applicationId} onChange={event => {setApplicationId(event.target.value);setResult(undefined);setMessage("");}}>
        {assignedIds.map(id => <option key={id}>{id}</option>)}
      </select></label>
      {assignmentStatus && <p role="status">{assignmentStatus}</p>}
      {applicationId && <DocumentManager key={applicationId} applicationId={applicationId} readOnly />}
    </section>}
    <label className="grid gap-1">Action<select disabled={busy} value={selected.key} onChange={e => {setChoice(e.target.value);setMessage("");setResult(undefined);}}>{entries.map(item => <option key={item.key} value={item.key}>{item.op.summary} ({item.method.toUpperCase()})</option>)}</select></label>
    <form key={selected.key + applicationId} className="grid gap-3" onSubmit={async e => {
      e.preventDefault();
      if (busy) return;
      const data = new FormData(e.currentTarget);
      const payload: Record<string, unknown> = {};
      const query = new URLSearchParams();
      let url = path;
      setMessage("");setResult(undefined);setBusy(true);
      try {
        for (const field of fields) {
          if(field.name === "scores" && field.in === "body") {
            const scores = Array.from(data.entries()).filter(([key,v]) => key.startsWith("score:") && v !== "").map(([key,v]) => {
              const id = key.slice(6);
              return {criterion_id:Number(id),score:Number(v),comment:String(data.get("comment:"+id) ?? "")};
            });
            if(!scores.length) throw new Error("Enter at least one criterion score before saving.");
            payload.scores = scores;
            continue;
          }
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
        if (method === "get" && e instanceof ApiError && e.status === 404 && detail === "Scoring session not found") {
          setMessage("No review has been saved for this application. Choose the scoring PUT action to enter your scores.");
        } else if (method === "get" && e instanceof ApiError && e.status === 404 && detail === "Adjudication not found") {
          setMessage("No decision has been recorded for this application yet.");
        } else setMessage(errorMessage(e));
      } finally {setBusy(false);}
    }}>
      {fields.map(field => {
        if(field.in === "body" && field.name === "scores") return <ScoreFields key="scores"/>;
        const schema = resolve(field.schema,contract);
        const name = field.in + field.name;
        if (evaluatorWorkspace && field.in === "path" && field.name === "application_id")
          return <input key={name} type="hidden" name={name} value={applicationId}/>;
        const options = schema.enum ?? (schema.type === "boolean" ? ["true","false"] : undefined);
        return <label className="grid gap-1" key={name}>{field.name.replaceAll("_"," ")}{field.required ? " *" : ""}
          {options ? <select name={name} required={field.required}><option value="">Select</option>{options.map(v => <option key={v}>{v}</option>)}</select>
          : ["array","object"].includes(schema.type ?? "") && field.in === "body" ? <textarea name={name} required={field.required} placeholder={field.name === "scores" ? '[{"criterion_id":1,"score":3,"comment":"Review notes"}]' : "Enter JSON"}/>
          : <input name={name} required={field.required} type={schema.format === "date" ? "date" : ["number","integer"].includes(schema.type ?? "") ? "number" : "text"} step={schema.type === "integer" ? 1 : "any"} />}
        </label>;
      })}
      {method === "delete" && <label><input type="checkbox" required/> Confirm deletion of this record</label>}
      <button disabled={busy || (evaluatorWorkspace && !applicationId)} className="rounded bg-brand-600 p-2 text-white">{busy ? "Working…" : op.summary}</button>
    </form><p role="status">{message}</p>{result !== undefined && <Result value={result}/>}
  </section>;
}
