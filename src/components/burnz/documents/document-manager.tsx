"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  documentsApi,
  type ApplicationDocumentOut,
  type RequiredDocumentOut,
} from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../ui/async-state";
import StatusBadge, { toneForState } from "../ui/status-badge";

export default function DocumentManager({
  applicationId,
  readOnly = false,
  canDecide = false,
  onChanged,
}: {
  applicationId: string;
  readOnly?: boolean;
  canDecide?: boolean;
  onChanged?: () => void;
}) {
  const t = useTranslations("common");
  const [required, setRequired] = useState<RequiredDocumentOut[]>([]);
  const [documents, setDocuments] = useState<ApplicationDocumentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentTypeId, setDocumentTypeId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [requiredResult, documentResult] = await Promise.all([
        documentsApi.required(applicationId),
        documentsApi.list(applicationId),
      ]);
      setRequired(requiredResult.data);
      setDocuments(documentResult.data);
      setDocumentTypeId((current) => current || requiredResult.data.find((item) => !item.uploaded)?.id || "");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async () => {
    if (!file || !documentTypeId) return;
    setUploading(true);
    setActionError(null);
    try {
      await documentsApi.upload(applicationId, {
        file,
        document_type_id: documentTypeId,
        file_description: description,
      });
      setFile(null);
      setDescription("");
      await load();
      onChanged?.();
    } catch (caught) {
      setActionError(errorMessage(caught));
    } finally {
      setUploading(false);
    }
  };

  const handleDecision = async (documentId: string, status: "accepted" | "rejected") => {
    setActionError(null);
    try {
      await documentsApi.decide(applicationId, documentId, {
        status,
        reason: status === "rejected" ? "Additional information required" : null,
      });
      await load();
      onChanged?.();
    } catch (caught) {
      setActionError(errorMessage(caught));
    }
  };

  if (loading) return <PanelSkeleton rows={4} />;
  if (error) return <PanelError message={error} onRetry={() => void load()} />;

  const uploadedCount = required.filter((item) => item.uploaded).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink-700 dark:text-gray-300">Required evidence</p>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {uploadedCount} of {required.length} uploaded
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-ink-800">
          <div
            className="h-2 rounded-full bg-action-600 transition-all"
            style={{ width: `${required.length ? (uploadedCount / required.length) * 100 : 0}%` }}
          />
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {required.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 dark:border-ink-800"
            >
              <div>
                <p className="text-sm font-medium text-ink-800 dark:text-gray-200">{item.name}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.description || "Supporting document"}</p>
              </div>
              <StatusBadge
                label={item.uploaded ? item.status ?? "pending" : "missing"}
                tone={item.uploaded ? toneForState(item.status ?? "pending") : "warning"}
              />
            </li>
          ))}
        </ul>
      </div>

      {!readOnly ? (
        <div className="rounded-lg border border-gray-200 bg-canvas p-4 dark:border-ink-700 dark:bg-ink-950/40">
          <p className="text-sm font-medium text-ink-800 dark:text-gray-200">Upload a document</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Document type
              <select
                value={documentTypeId}
                onChange={(event) => setDocumentTypeId(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-ink-800 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
              >
                <option value="">Select a type</option>
                {required.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              File
              <input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="mt-1.5 block w-full text-xs text-gray-600 file:me-3 file:rounded-md file:border-0 file:bg-ink-800 file:px-3 file:py-2 file:text-white dark:text-gray-400"
              />
            </label>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 sm:col-span-2">
              Description (optional)
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What does this file show?"
                className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-ink-700 dark:bg-ink-900 dark:text-white"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={() => void handleUpload()} disabled={!file || !documentTypeId || uploading} size="sm">
              {uploading ? "Uploading…" : "Upload document"}
            </Button>
            {uploading ? <span className="text-xs text-gray-500">Waiting for Django to confirm the upload…</span> : null}
          </div>
        </div>
      ) : null}

      {actionError ? <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p> : null}

      <div>
        <p className="text-sm font-medium text-ink-700 dark:text-gray-300">Uploaded files</p>
        {documents.length === 0 ? (
          <div className="mt-3">
            <PanelEmpty message="No documents have been uploaded for this application yet." />
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-ink-800">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-800 dark:text-gray-200">
                    {document.document_type.name}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {document.file_description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {document.file.endsWith("/download") && (
                    <a className="text-brand-600 underline dark:text-brand-300" href={`/api/backend/api/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(document.id)}/download`}>
                      {t("downloadDocument")}
                    </a>
                  )}
                  <StatusBadge label={document.status} tone={toneForState(document.status)} />
                  {canDecide && document.status !== "accepted" ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => void handleDecision(document.id, "rejected")}>
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => void handleDecision(document.id, "accepted")}>
                        Accept
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
