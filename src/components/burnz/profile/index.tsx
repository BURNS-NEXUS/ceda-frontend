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

/** Signed-in identity plus the organisation details recorded on the user's applications. */
export default function ProfileAndOrganisation() {
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
      const [userResult, accountResult, appsResult] = await Promise.all([
        getCurrentUser(),
        getMyPermissions(),
        listApplications(),
      ]);
      setUser(userResult);
      setAccount(accountResult);
      setApplications(appsResult.data);
      const firstId = appsResult.data[0]?.id ?? null;
      setSelectedId(firstId);
      setDetail(firstId ? await getApplication(firstId) : null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

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

  if (loading) return <PanelSkeleton rows={4} />;
  if (!user && error) return <PanelError message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      {error ? <PanelError message={error} /> : null}
      <AccountCard user={user} permissions={account} />
      <OrganisationCard
        applications={applications}
        selectedId={selectedId}
        detail={detail}
        loadingDetail={loadingDetail}
        onSelect={(id) => void handleSelect(id)}
      />
    </div>
  );
}
