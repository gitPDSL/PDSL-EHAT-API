import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

@Injectable()
export class TransfromInterceptor implements NestInterceptor {
    private readonly logger = new Logger(TransfromInterceptor.name);
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        this.logger.debug(`Request completed on ${process.env.TZ} ${new Date().toString()}`)
        return next.handle().pipe(map((data) => ({
            ...{
                meta: {
                    ...{
                        status: 'success',
                        timestamp: new Date().toISOString(),
                    },
                    ...(data.message ? data : {})
                },
                ...(data.message ? {} : { data }),
            }
        })))
    }

}
