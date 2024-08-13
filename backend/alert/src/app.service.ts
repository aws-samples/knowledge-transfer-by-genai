import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  Alert,
  findAllAlerts,
  findAlertById,
  storeAlert,
  findAllMeetingsByAlertId,
  findMeetingById,
  removeAlert,
  removeAllAlerts,
  updateAlertStatus,
  closeWithComment,
  Severity,
  Status,
} from "@industrial-knowledge-transfer-by-genai/common";

@Injectable()
export class AppService {
  async getAlerts(): Promise<Alert[]> {
    const alerts = await findAllAlerts();
    return alerts;
  }

  async getAlert(alertId: string): Promise<Alert> {
    const alert = await findAlertById(alertId);
    return alert;
  }

  async createDummyAlert(): Promise<Alert> {
    const alert: Alert = {
      id: uuidv4(),
      name: "Dummy Alert",
      description: "This is a dummy alert",
      openedAt: new Date().toISOString(),
      closedAt: "",
      status: "OPEN",
      // Random severity
      severity: ["CRITICAL", "HIGH", "MEDIUM", "LOW"][
        Math.floor(Math.random() * 4)
      ] as Severity,
      comment: "",
      meetingIds: [],
    };
    return await storeAlert(alert);
  }

  async deleteAlert(alertId: string): Promise<void> {
    await removeAlert(alertId);
  }

  async deleteAllAlerts(): Promise<void> {
    await removeAllAlerts();
  }

  async getAllMeetingsByAlertId(alertId: string): Promise<any> {
    const meetings = await findAllMeetingsByAlertId(alertId);
    return meetings;
  }

  async updateAlertStatus(alertId: string, status: string): Promise<void> {
    await updateAlertStatus(alertId, status as Status);
  }

  async closeWithComment(alertId: string, comment: string): Promise<void> {
    await closeWithComment(alertId, comment);
  }

  async getMeeting(meetingId: string): Promise<any> {
    const meeting = await findMeetingById(meetingId);
    return meeting;
  }
}
