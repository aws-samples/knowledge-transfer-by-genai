import { Controller, Get, Post, Put, Delete, Param } from "@nestjs/common";
import { AppService } from "./app.service";
import { Alert } from "@industrial-knowledge-transfer-by-genai/common";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get("/health")
  health(): any {
    return { message: "ok" };
  }

  @Get("/alert-table-name")
  getAlertTableName(): string {
    return this.appService.getAlertTableName();
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
}
