import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { APP_CONFIG, AppConfig } from './config/app.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const config = app.get<AppConfig>(APP_CONFIG);

  configureApp(app, config);
  await app.listen(config.port, '0.0.0.0');

  new Logger('Bootstrap').log(
    `${config.serviceName} 이(가) ${config.port} 포트에서 실행 중입니다.`,
  );
}

bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  process.exit(1);
});
