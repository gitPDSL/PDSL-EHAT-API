import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus
} from '@nestjs/common';
import { MongoError } from 'mongodb';
import { Response } from 'express';

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    // Handle specific Mongo error codes
    switch (exception.code) {
      case 11000: // Duplicate key
        status = HttpStatus.CONFLICT;
        message = 'Duplicate key error';
        break;
      // Add other Mongo error codes here
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.message
    });
  }
}
