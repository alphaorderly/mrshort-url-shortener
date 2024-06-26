import { HttpException, HttpStatus } from '@nestjs/common';

export class AlreadyUrlExistException extends HttpException {
  constructor() {
    super('The URL already exists', HttpStatus.BAD_REQUEST);
  }
}
