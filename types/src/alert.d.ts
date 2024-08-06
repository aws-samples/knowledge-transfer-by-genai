export type Status = "OPEN" | "CLOSED";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Meeting = {
  id: string;
};
export type Alert = {
  id: string;
  name: string;
  description: string;
  openedAt: string;
  closedAt: string;
  status: Status;
  severity: Severity;
  comment: string;
  meetings: Meeting[];
};
