import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { PasswordRequiredException } from 'src/exception/PasswordRequired.exception';

@Catch(PasswordRequiredException)
export class PasswordRequiredExceptionFilter implements ExceptionFilter {
  catch(exception: PasswordRequiredException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(200).render('password');
  }
}
