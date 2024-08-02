import { Alert } from "@types/industrial-knowledge-transfer-by-genai";

export type DashboardAlert = Alert & {
  severityColor: string;
  statusColor: string;
};
