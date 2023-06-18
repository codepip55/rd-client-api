import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { captureException } from '@sentry/node';

import { User } from '../users/schemas/user.schema';

const ignoreStatuses = [401, 403];

@Catch()
export class LoggingFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    let eventId: string;
    if (!ignoreStatuses.includes(status)) {
      const cid = (request.user as User)?.cid;
      const username = cid?.toString();
      eventId = captureException(exception, {
        user: username ? { username } : undefined,
      });

      console.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      eventId: eventId || undefined,
    });
  }
}
