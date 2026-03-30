import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const isProduction = process.env.NODE_ENV === 'production';

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        let message: string | object;

        if (exception instanceof HttpException) {
            const res = exception.getResponse();
            message =
                typeof res === 'string' ? res : (res as any).message || res;
        } else {
            // Unknown / unhandled error — always log server-side
            this.logger.error(
                `Unhandled exception on ${request.method} ${request.url}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
            // Never leak internals to the client in production
            message = isProduction
                ? 'Internal server error'
                : exception instanceof Error
                    ? exception.message
                    : String(exception);
        }

        const body: Record<string, any> = {
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        // Only include stack trace in non-production environments
        if (!isProduction && exception instanceof Error) {
            body.stack = exception.stack;
        }

        response.status(status).json(body);
    }
}
