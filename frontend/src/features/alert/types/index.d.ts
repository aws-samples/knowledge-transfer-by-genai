import { Alert } from "@/types/alert";

export type DashboardAlert = Alert & {
  severityColor: string;
  statusColor: string;
};
