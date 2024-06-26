import { HttpException, HttpStatus } from '@nestjs/common';

export class PasswordRequiredException extends HttpException {
  constructor() {
    super('Password is required to access this URL', HttpStatus.UNAUTHORIZED);
  }
}
