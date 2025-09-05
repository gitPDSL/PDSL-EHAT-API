import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

@Injectable()
export class TransfromInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        console.log('Request completed on', process.env.TZ, new Date().toString())
        return next.handle().pipe(map((data) => ({
            ...{
                meta: {
                    ...{
                        status: 'success',
                        timestamp: toISTISOString(new Date()),
                    },
                    ...(data.message ? data : {})
                },
                ...(data.message ? {} : { data }),
            }
        })))
    }

}
export const toISTISOString = (date: Date): string => {
    const offset = 5.5 * 60; // IST offset in minutes
    const local = new Date(date.getTime() + offset * 60000);
    const iso = local.toISOString().replace("Z", "+05:30");
    return iso;
}