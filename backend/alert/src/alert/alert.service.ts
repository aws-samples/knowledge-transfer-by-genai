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
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class AlertService {
  private s3Client: S3Client;

  constructor() {
    const region = process.env.REGION || "ap-northeast-1";
    this.s3Client = new S3Client({ region: region });
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
      meetingIds: [],
      conversation: {
        messages: [],
      },
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

  async issueMeetingVideoUrl(meetingId: string): Promise<string> {
    const bucketName = process.env.CONCATENATED_BUCKET_NAME;
    const meeting = await findMeetingById(meetingId);

    if (!meeting.concatPipelineArn) {
      throw new Error(`Meeting ${meetingId} does not have a concatPipelineArn`);
    }

    const arnParts = meeting.concatPipelineArn.split("/");
    const mediaPipelineId = arnParts[arnParts.length - 1];

    const objectKey = `video/${meetingId}/composited-video/${mediaPipelineId}.mp4`;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    return signedUrl;
  }
}
