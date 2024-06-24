import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { UnauthorizedExceptionFilter } from './filter/unauthorized-exception.filter';
import cookieParser from 'cookie-parser';
import { AuthService } from './auth/auth.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  const authService = app.get(AuthService);

  const users = await authService.findAll();

  if (users.length === 0) {
    const id = process.env.ID;
    const pw = process.env.PW;

    if (!id || !pw) {
      return;
    }

    authService.register(id, pw);
  }

  app.setViewEngine('hbs');

  app.set('view options', { layout: 'layouts/main' });

  app.use(cookieParser());

  app.useGlobalFilters(new UnauthorizedExceptionFilter());

  await app.listen(3000);
}

bootstrap();
