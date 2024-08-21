import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

const CORS_ALLOW_ORIGINS = process.env.CORS_ALLOW_ORIGINS || "localhost:5173";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Add `api` prefix
  // This prefix is also registered in cloudfront behavior
  app.setGlobalPrefix("api");

  // Allow local development
  app.enableCors({
    origin: "http://localhost:5173",
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
