"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, mutate, mutateForm } from "@/lib/api/client";
import ApplicationWizard from "./applications/wizard";
import { errorMessage } from "./ui/async-state";

interface Call {
  id: number;
  title: string;
  description: string;
  eligibility: string;
  required_documents: string;
  opens_on: string;
  closes_on: string;
  status: "draft" | "upcoming" | "open" | "closed";
  has_brief: boolean;
}

interface Entry { id: string; project_title: string; email: string; state: string }

const fields = ["title", "description", "eligibility", "required_documents", "opens_on", "closes_on"] as const;
const endpoint = "/api/programmes/";

export default function ProgrammeCalls({ manage = false }: { manage?: boolean }) {
  const t = useTranslations("programmeCalls");
  const [calls, setCalls] = useState<Call[]>([]);
  const [entries, setEntries] = useState<Record<number, Entry[]>>({});
  const [selected, setSelected] = useState<Call>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [submitted, setSubmitted] = useState("");
  useEffect(() => {
    let active = true;
    apiFetch<Call[]>(endpoint).then(rows => { if (active) setCalls(rows); })
      .catch(e => { if (active) setError(errorMessage(e)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);
  async function run(action: () => Promise<void>) {
    setError(""); setBusy(true);
    try { await action(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  if (selected) return <section className="space-y-4">
    <h2>{selected.title}</h2>
    <Button variant="outline" onClick={() => setSelected(undefined)}>{t("back")}</Button>
    <ApplicationWizard programmeCallId={selected.id} onDone={id => { setSubmitted(id); setSelected(undefined); }} />
  </section>;
  return <section className="space-y-5" aria-busy={busy}>
    {error && <p role="alert">{error}</p>}
    {submitted && <p role="status">{t("submitted", {id: submitted})}</p>}
    {manage && <form className="grid gap-3 rounded-xl border p-5" onSubmit={event => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const file = data.get("brief");
      if (file instanceof File && !file.name) data.delete("brief");
      void run(async () => {
        const draft = await mutateForm<Call>(endpoint, "POST", data);
        setCalls(previous => [draft, ...previous]); form.reset();
      });
    }}>
      <h2 className="font-semibold">{t("new")}</h2>
      {fields.map(name => <label key={name}>{t(name)}<Input name={name} required maxLength={name === "title" ? 255 : undefined} type={name.endsWith("_on") ? "date" : "text"}/></label>)}
      <label>{t("brief")}<Input type="file" name="brief" accept="application/pdf"/></label>
      <Button disabled={busy} type="submit">{t("save")}</Button>
    </form>}
    {busy && <p role="status">{t("loading")}</p>}
    {!busy && !error && !calls.length && <p>{t("empty")}</p>}
    {calls.map(call => <article key={call.id} className="space-y-3 rounded-xl border p-5">
      <h2 className="font-semibold">{call.title}</h2>
      <p>{t(call.status)} · {call.opens_on} – {call.closes_on}</p>
      <p>{call.description}</p>
      <p><strong>{t("eligibility")} </strong>{call.eligibility}</p>
      <p><strong>{t("required_documents")} </strong>{call.required_documents}</p>
      {call.has_brief && <a className="underline" href={`/api/backend/api/programmes/${call.id}/brief`}>{t("download")}</a>}
      <div className="flex gap-2">
        {!manage && call.status === "open" && <Button onClick={() => setSelected(call)}>{t("apply")}</Button>}
        {manage && call.status === "draft" && <Button disabled={busy} onClick={() => void run(async () => {
          const updated = await mutate<Call>(endpoint + call.id + "/publish", "POST");
          setCalls(rows => rows.map(row => row.id === updated.id ? updated : row));
        })}>{t("publish")}</Button>}
        {manage && <Button disabled={busy} variant="outline" onClick={() => void run(async () => {
          const rows = await apiFetch<Entry[]>(endpoint + call.id + "/applications");
          setEntries(previous => ({...previous, [call.id]: rows}));
        })}>{t("applications")}</Button>}
      </div>
      {entries[call.id] && (entries[call.id].length ? <ul>{entries[call.id].map(row =>
        <li key={row.id}>{row.project_title} · {row.email} · {row.state}</li>)}</ul> : <p>{t("noEntries")}</p>)}
    </article>)}
  </section>;
}
