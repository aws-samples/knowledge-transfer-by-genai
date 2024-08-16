import { Controller, Post, Body, Sse, Param, Get, Res } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { PostMessageRequest } from "@industrial-knowledge-transfer-by-genai/common";
import { Observable } from "rxjs";
import { Response } from "express";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  streamMessage(
    @Body() postMessageRequest: PostMessageRequest,
    @Res() res: Response
  ): void {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const observable = this.chatService.handleMessage(postMessageRequest);

    observable.subscribe({
      next: (message) => res.write(message.data),
      error: (err) => {
        console.error(err);
        res.end();
      },
      complete: () => res.end(),
    });
  }

  @Get(":alertId")
  async getConversation(@Param("alertId") alertId: string) {
    return this.chatService.getConversationByAlertId(alertId);
  }
}
