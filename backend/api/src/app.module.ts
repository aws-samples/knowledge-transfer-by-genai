import { Module, MiddlewareConsumer } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AlertModule } from "./alert/alert.module";
import { ChatModule } from "./chat/chat.module";
import { LoggerMiddleware } from "./middleware";

@Module({
  imports: [AlertModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes("");
  }
}
