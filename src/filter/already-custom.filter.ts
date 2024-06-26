import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { AlreadyUrlExistException } from 'src/exception/AlreadyUrlExist.exception';

@Catch(AlreadyUrlExistException)
export class AlreadyUrlExistFilter implements ExceptionFilter {
  catch(exception: AlreadyUrlExistException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response
      .status(400)
      .json('해당 URL이 이미 존재합니다. URL already exists.');
  }
}
