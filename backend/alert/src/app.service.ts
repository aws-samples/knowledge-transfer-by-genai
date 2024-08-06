import { Injectable } from "@nestjs/common";
import {
  Severity,
  getTableName,
} from "@industrial-knowledge-transfer-by-genai/common";
import { v4 as uuidv4 } from "uuid";
import {
  Alert,
  findAllAlerts,
  findAlertById,
  createAlert,
} from "@industrial-knowledge-transfer-by-genai/common";

@Injectable()
export class AppService {
  getHello(): string {
    return "Hello World!";
  }

  getAlertTableName(): string {
    //debug
    // return "debug";
    return getTableName();
  }

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
      meetings: [],
    };
    return await createAlert(alert);
  }
}
