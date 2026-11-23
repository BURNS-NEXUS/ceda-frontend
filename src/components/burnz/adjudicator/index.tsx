"use client";

import { useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import { errorMessage, PanelError, PanelSkeleton } from "../ui/async-state";
import SectionCard from "../ui/section-card";
import CaseSwitcher from "./case-switcher";
import Comparison from "./comparison";
import Decisions from "./decisions";
import DecisionHistory from "./history";
import Queue from "./queue";
import type { AdjudicationCase } from "./types";
import { loadAdjudicationCases } from "./utils";

const SELECTED_CASE_KEY = "ceda.adjudicator.case";

/**
 * Shared shell for the adjudicator portal. The selected case is kept in the
 * browser session (not in the URL) so no opaque application identifiers are
 * displayed while moving between the decision screens.
 */
export default function AdjudicatorWorkspace({
  screenKey,
}: {
  screenKey: string;
}) {
  const router = useRouter();
  const [cases, setCases] = useState<AdjudicationCase[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await loadAdjudicationCases(true);
      setCases(items);
      const stored =
        typeof window === "undefined"
          ? null
          : window.sessionStorage.getItem(SELECTED_CASE_KEY);
      setSelectedId(
        stored && items.some((item) => item.applicationId === stored)
          ? stored
          : (items[0]?.applicationId ?? ""),
      );
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectCase = useCallback((applicationId: string) => {
    setSelectedId(applicationId);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(SELECTED_CASE_KEY, applicationId);
    }
  }, []);

  const openCase = useCallback(
    (applicationId: string) => {
      selectCase(applicationId);
      router.push("/adjudicator/comparison");
    },
    [router, selectCase],
  );

  if (loading) return <PanelSkeleton rows={4} />;
  if (error && cases.length === 0) {
    return <PanelError message={error} onRetry={() => void load()} />;
  }

  const selectedCase = cases.find((item) => item.applicationId === selectedId);

  return (
    <div className="space-y-6">
      {error ? (
        <PanelError message={error} onRetry={() => void load()} />
      ) : null}

      {screenKey === "adjudicator/queue" ? (
        <Queue cases={cases} onOpen={openCase} />
      ) : cases.length === 0 ? (
        <SectionCard
          title="No assigned cases"
          description="Decisions appear here when the programme administrator assigns you an adjudication case."
        >
          <PanelError message="There are no adjudication cases assigned to your account yet." />
        </SectionCard>
      ) : (
        <>
          <CaseSwitcher
            cases={cases}
            selectedId={selectedId}
            onSelect={selectCase}
          />
          {screenKey === "adjudicator/comparison" ? (
            <Comparison applicationId={selectedId} />
          ) : screenKey === "adjudicator/decisions" ? (
            <Decisions
              applicationId={selectedId}
              caseTitle={selectedCase?.title ?? "this case"}
              onChanged={() => void load()}
            />
          ) : (
            <DecisionHistory cases={cases} />
          )}
        </>
      )}
    </div>
  );
}
