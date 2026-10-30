import {
  BadRequestException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

function collect(errors: ValidationError[], into: Record<string, string[]>) {
  for (const error of errors) {
    if (error.constraints) {
      into[error.property] = Object.values(error.constraints);
    }
    if (error.children?.length) collect(error.children, into);
  }
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const fields: Record<string, string[]> = {};
      collect(errors, fields);
      return new BadRequestException({
        statusCode: 400,
        message: '입력값을 확인해 주세요.',
        errors: fields,
      });
    },
  });
}
