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
  app.disable('x-powered-by');
  // 프록시 뒤에서는 소켓 주소가 프록시 것이라, 요청 제한이 모든 접속자를 한 명으로 센다.
  app.set('trust proxy', config.trustProxy);

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
  app.use(originGuard());
  app.useGlobalPipes(createValidationPipe());

  const indexPath = mountSpa(app, config.webDist);
  app.useGlobalFilters(new SpaNotFoundFilter(indexPath));

  app.enableShutdownHooks();
}
