import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { originGuard } from './common/origin-guard.middleware';
import { SpaNotFoundFilter } from './common/spa-not-found.filter';
import { createValidationPipe } from './common/validation';
import { AppConfig } from './config/app.config';
import { mountSpa } from './spa/spa';

/** 실제 서버(main.ts)와 e2e 테스트가 같은 설정을 쓰도록 한곳에 모았다. */
export function configureApp(
  app: NestExpressApplication,
  config: AppConfig,
): void {
  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        // http 로 서비스하는 환경(내부망, 로컬)에서도 CSS/JS 가 막히지 않도록 한다.
        directives: { 'upgrade-insecure-requests': null },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '16kb' });
  app.use(originGuard(config));
  app.useGlobalPipes(createValidationPipe());

  const indexPath = mountSpa(app, config.webDist);
  app.useGlobalFilters(new SpaNotFoundFilter(indexPath));

  app.enableShutdownHooks();
}
