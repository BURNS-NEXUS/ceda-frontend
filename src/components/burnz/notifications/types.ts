import type { StatusTone } from "../ui/status-badge";

export type NotificationItem = {
  id: string;
  title: string;
  projectTitle: string;
  description: string;
  detail?: string;
  badgeLabel: string;
  badgeTone: StatusTone;
  timestamp: string | null;
};
