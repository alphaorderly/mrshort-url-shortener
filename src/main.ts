import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { UnauthorizedExceptionFilter } from './filter/unauthorized-exception.filter';
import cookieParser from 'cookie-parser';
import { AuthService } from './auth/auth.service';
import prompts from 'prompts';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  const authService = app.get(AuthService);

  const users = await authService.findAll();

  if (users.length === 0) {
    try {
      const questions = [
        {
          type: 'text',
          name: 'username',
          message: '아이디 입력:',
        },
        {
          type: 'password',
          name: 'password',
          message: '비밀번호 입력:',
        },
      ];

      const answers = await prompts(questions);

      await authService.register(answers.username, answers.password);
      console.log('User created successfully!');
    } catch (error) {
      console.error('Error during user creation prompt:', error);
    }
  }

  app.setViewEngine('hbs');

  app.set('view options', { layout: 'layouts/main' });

  app.use(cookieParser());

  app.useGlobalFilters(new UnauthorizedExceptionFilter());

  await app.listen(3000);
}

bootstrap();
