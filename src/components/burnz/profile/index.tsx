"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getCurrentUser,
  getApplication,
  getMyPermissions,
  listApplications,
  type ApplicationDetailOut,
  type ApplicationOut,
  type UserOut,
  type UserPermissionsOut,
} from "@/lib/api/client";
import { errorMessage, PanelError, PanelSkeleton } from "../ui/async-state";
import AccountCard from "./account-card";
import OrganisationCard from "./organisation-card";

interface ProfileAndOrganisationProps {
  /** Only innovators/customers have their own applications to show organisation details for. */
  showOrganisation?: boolean;
}

/** Signed-in identity, editable for every role, plus organisation details for innovators. */
export default function ProfileAndOrganisation({
  showOrganisation = true,
}: ProfileAndOrganisationProps) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [account, setAccount] = useState<UserPermissionsOut | null>(null);
  const [applications, setApplications] = useState<ApplicationOut[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ApplicationDetailOut | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userResult, accountResult] = await Promise.all([
        getCurrentUser(),
        getMyPermissions(),
      ]);
      setUser(userResult);
      setAccount(accountResult);
      if (showOrganisation) {
        const appsResult = await listApplications();
        setApplications(appsResult.data);
        const preferred =
          appsResult.data.find((app) => ["draft", "feedback"].includes(app.state)) ??
          appsResult.data[0] ??
          null;
        setSelectedId(preferred?.id ?? null);
        setDetail(preferred ? await getApplication(preferred.id) : null);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [showOrganisation]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelect = useCallback(async (id: string) => {
    setSelectedId(id);
    setLoadingDetail(true);
    try {
      setDetail(await getApplication(id));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleAccountSaved = useCallback((updated: UserOut) => {
    setUser(updated);
    window.localStorage.setItem("ceda-auth-user", JSON.stringify(updated));
  }, []);

  const handleOrganisationSaved = useCallback(async () => {
    if (!selectedId) return;
    setLoadingDetail(true);
    try {
      setDetail(await getApplication(selectedId));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedId]);

  if (loading) return <PanelSkeleton rows={4} />;
  if (!user && error) return <PanelError message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      {error ? <PanelError message={error} /> : null}
      <AccountCard user={user} permissions={account} onSaved={handleAccountSaved} />
      {showOrganisation ? (
        <OrganisationCard
          applications={applications}
          selectedId={selectedId}
          detail={detail}
          loadingDetail={loadingDetail}
          onSelect={(id) => void handleSelect(id)}
          onSaved={() => void handleOrganisationSaved()}
        />
      ) : null}
    </div>
  );
}
