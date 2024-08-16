import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Patch,
  Body,
  Sse,
} from "@nestjs/common";
import { AppService } from "./app.service";
import {
  Alert,
  Meeting,
  Status,
} from "@industrial-knowledge-transfer-by-genai/common";
import { interval, map } from "rxjs";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/health")
  health(): any {
    return { message: "ok" };
  }

  @Get("/meeting/:meetingId")
  async getMeeting(@Param("meetingId") meetingId: string): Promise<Meeting> {
    return await this.appService.getMeeting(meetingId);
  }

  @Sse("/sse-test")
  sse() {
    return interval(1000).pipe(map(() => ({ data: { value: Math.random() } })));
  }
}
