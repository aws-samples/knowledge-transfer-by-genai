import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, _: Response, next: () => void): void {
    this.logger.log(this.createMessage(req));
    next();
  }

  private createMessage(req: Request): string {
    const { body } = req;
    const msg = `api request [url=${req.url}, method=${req.method}, body=${JSON.stringify(body)}, ip=${req.ip}]`;
    return msg;
  }
}
