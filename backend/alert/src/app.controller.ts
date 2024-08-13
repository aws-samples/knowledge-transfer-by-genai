import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Patch,
  Body,
} from "@nestjs/common";
import { AppService } from "./app.service";
import {
  Alert,
  Meeting,
  Status,
} from "@industrial-knowledge-transfer-by-genai/common";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  health(): any {
    return { message: "ok" };
  }

  @Get("/alerts")
  async getAlerts(): Promise<Alert[]> {
    return await this.appService.getAlerts();
  }

  @Get("/alert/:alertId")
  async getAlert(@Param("alertId") alertId: string): Promise<Alert> {
    return await this.appService.getAlert(alertId);
  }

  @Post("/alert/dummy")
  async createDummyAlert(): Promise<Alert> {
    return await this.appService.createDummyAlert();
  }

  @Delete("/alert/:alertId")
  async deleteAlert(@Param("alertId") alertId: string): Promise<void> {
    await this.appService.deleteAlert(alertId);
  }

  @Delete("/alerts")
  async deleteAllAlerts(): Promise<void> {
    await this.appService.deleteAllAlerts();
  }

  @Patch("/alert/:alertId/status")
  async updateAlertStatus(
    @Param("alertId") alertId: string,
    @Body("status") status: Status
  ): Promise<void> {
    await this.appService.updateAlertStatus(alertId, status);
  }

  @Patch("/alert/:alertId/close")
  async closeWithComment(
    @Param("alertId") alertId: string,
    @Body("comment") comment: string
  ): Promise<void> {
    await this.appService.closeWithComment(alertId, comment);
  }

  @Get("/alert/:alertId/meetings")
  async getAllMeetingsByAlertId(
    @Param("alertId") alertId: string
  ): Promise<Meeting> {
    return await this.appService.getAllMeetingsByAlertId(alertId);
  }

  @Get("/meeting/:meetingId")
  async getMeeting(@Param("meetingId") meetingId: string): Promise<Meeting> {
    return await this.appService.getMeeting(meetingId);
  }
}
