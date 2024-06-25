import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { UnauthorizedExceptionFilter } from './filter/unauthorized-exception.filter';
import cookieParser from 'cookie-parser';
import * as expressHandlebars from 'express-handlebars';
import { NotFoundExceptionFilter } from './filter/notfound-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));

  const hbs = expressHandlebars.create({
    extname: '.hbs',
    layoutsDir: join(__dirname, '..', 'views', 'layouts'),
    defaultLayout: 'main',
    helpers: {
      formatDateWithoutLib: (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      },
    },
  });

  // Set engine
  app.engine('hbs', hbs.engine);
  app.setViewEngine('hbs');

  app.set('view options', { layout: 'layouts/main' });

  app.use(cookieParser());
  app.useGlobalFilters(new UnauthorizedExceptionFilter());
  app.useGlobalFilters(new NotFoundExceptionFilter());

  await app.listen(3000);
}

bootstrap();
