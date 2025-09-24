import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { MongoError, MongoServerError } from 'mongodb';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const timestamp = new Date().toISOString();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: any = 'Internal server error';
        let error: any = 'Error';
        // console.log('exception---', exception)
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
            } else if (typeof res === 'object') {
                const r = res as any;
                message = r.message || message;
                error = r.error || error;
            }
        }
        if (exception instanceof MongoServerError) {
            switch (exception.code) {
                case 11000:
                    status = HttpStatus.CONFLICT;
                    error = exception.errorResponse;
                    message = exception.errorResponse ? exception.errorResponse.errmsg : '';
                    break;
                default:
                    status = HttpStatus.BAD_REQUEST;
                    message = exception.errorResponse.errmsg;
                    error = exception.errorResponse;
            }
        }

        response.status(status).json({
            meta: {
                status: 'error',
                message,
                error,
                timestamp,
                // path: request.url,
            }
        });
    }
}
