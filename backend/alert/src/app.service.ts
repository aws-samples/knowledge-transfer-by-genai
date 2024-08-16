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
  async getMeeting(meetingId: string): Promise<any> {
    const meeting = await findMeetingById(meetingId);
    return meeting;
  }
}
