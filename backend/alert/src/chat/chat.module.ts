import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatRepository } from "@industrial-knowledge-transfer-by-genai/common";

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
