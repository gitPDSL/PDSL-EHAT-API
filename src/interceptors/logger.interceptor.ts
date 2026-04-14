import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Request, Response } from "express";
import { Observable, tap } from "rxjs";

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggerInterceptor.name);
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const startTime = Date.now();
        return next.handle().pipe(tap(() => {
            const endTime = Date.now();
            const resTime = endTime - startTime;
            const reqId = (request as any).id;
            this.logger.log(`${reqId ? `[${reqId}] ` : ''}${request.method} ${request.path} ${response.statusCode} ${resTime}ms`);
        }))
    }

}