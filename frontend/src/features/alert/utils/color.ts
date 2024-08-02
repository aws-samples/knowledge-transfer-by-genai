import { Severity, Status } from "industrial-knowledge-transfer-by-genai";

export const getSeverityColor = (severity: Severity) => {
  let color = "";
  switch (severity) {
    case "CRITICAL":
      color = "#be123c";
      break;
    case "HIGH":
      color = "#f43f5e";
      break;
    case "MEDIUM":
      color = "#d97706";
      break;
    case "LOW":
      color = "#f59e0b";
      break;
    default:
      color = "";
  }
  return color;
};

export const getStatusColor = (status: Status) => {
  return status && status === "CLOSED" ? "#10b981" : "";
};
