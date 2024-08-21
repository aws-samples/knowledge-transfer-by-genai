import { Module } from "@nestjs/common";
import { AlertController } from "./alert.controller";
import { AlertService } from "./alert.service";

@Module({
  controllers: [AlertController],
  providers: [AlertService],
})
export class AlertModule {}
