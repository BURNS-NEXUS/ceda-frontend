"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listApplications,
  listClarifications,
  type ApplicationOut,
  type ClarificationOut,
} from "@/lib/api/client";
import { errorMessage, PanelEmpty, PanelError, PanelSkeleton } from "../ui/async-state";
import SectionCard from "../ui/section-card";
import NotificationRow from "./notification-row";
import { buildNotifications } from "./utils";

export default function NotificationsScreen() {
  const [applications, setApplications] = useState<ApplicationOut[]>([]);
  const [clarifications, setClarifications] = useState<ClarificationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [applicationResult, clarificationResult] = await Promise.all([
        listApplications({ take: 100 }),
        listClarifications({ take: 100 }),
      ]);
      setApplications(applicationResult.data);
      setClarifications(clarificationResult.data);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = buildNotifications(applications, clarifications);

  return (
    <SectionCard
      title="Your notifications"
      description="Application status changes and clarification requests, read live from the Django API."
    >
      {loading ? (
        <PanelSkeleton rows={4} />
      ) : error ? (
        <PanelError message={error} onRetry={() => void load()} />
      ) : items.length === 0 ? (
        <PanelEmpty message="No application updates or clarification requests yet." />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <NotificationRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
