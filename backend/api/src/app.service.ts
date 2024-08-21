import { Injectable } from "@nestjs/common";
import { findMeetingById } from "@industrial-knowledge-transfer-by-genai/common";

@Injectable()
export class AppService {
  async getMeeting(meetingId: string): Promise<any> {
    const meeting = await findMeetingById(meetingId);
    return meeting;
  }
}
