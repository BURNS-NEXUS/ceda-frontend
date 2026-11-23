"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { documentsApi, type ApplicationDocumentOut } from "@/lib/api/client";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../../ui/async-state";
import StatusBadge, { toneForState } from "../../ui/status-badge";

/** Reviewer-facing evidence panel: list and download only, no in-app preview. */
export default function EvidenceList({ applicationId }: { applicationId: string }) {
  const t = useTranslations("common");
  const [documents, setDocuments] = useState<ApplicationDocumentOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDocuments((await documentsApi.list(applicationId)).data);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PanelSkeleton rows={3} />;
  if (error) return <PanelError message={error} onRetry={() => void load()} />;

  return (
    <div>
      {documents.length === 0 ? (
        <PanelEmpty message="No documents have been uploaded for this application." />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-ink-800">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-800 dark:text-gray-200">
                  {document.document_type.name}
                </p>
                {document.file_description ? (
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {document.file_description}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge label={document.status} tone={toneForState(document.status)} />
                <a
                  className="text-sm font-medium text-brand-600 underline dark:text-brand-300"
                  href={`/api/backend/api/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(document.id)}/download`}
                >
                  {t("downloadDocument")}
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Download the files you need. This portal does not preview documents in the browser.
      </p>
    </div>
  );
}
