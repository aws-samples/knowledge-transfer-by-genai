import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AlertModule } from "./alert/alert.module";
import { ChatModule } from "./chat/chat.module";

@Module({
  imports: [AlertModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
