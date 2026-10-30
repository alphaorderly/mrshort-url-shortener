import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { NextFunction, Request, Response } from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

const APP_PATH = '/~';

/**
 * 빌드된 프론트엔드(web/dist)를 정적 파일로 서비스하고,
 * 앱은 `/~` 아래에 두고 하위 경로는 모두 index.html 로 응답한다(SPA 라우팅).
 * `~` 는 짧은 주소에 쓸 수 없는 문자라서 어떤 짧은 주소와도 겹치지 않는다.
 * 대표 주소(`/`)로 들어오면 `/~` 으로 보낸다.
 * 빌드 결과가 없으면 null 을 돌려주고 API 만 동작한다.
 */
export function mountSpa(
  app: NestExpressApplication,
  webDist: string,
): string | null {
  const logger = new Logger('Spa');
  const indexPath = join(webDist, 'index.html');

  if (!existsSync(indexPath)) {
    logger.warn(`프론트엔드 빌드를 찾을 수 없어 API 만 제공합니다: ${webDist}`);
    return null;
  }

  const assetsDir = join(webDist, 'assets');
  app.useStaticAssets(webDist, {
    prefix: APP_PATH,
    index: false,
    redirect: false,
    setHeaders: (res, filePath) => {
      res.setHeader(
        'Cache-Control',
        filePath.startsWith(assetsDir)
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
      );
    },
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const isPage = req.method === 'GET' || req.method === 'HEAD';
    if (isPage && req.path === '/') {
      res.redirect(302, APP_PATH);
      return;
    }
    if (
      isPage &&
      (req.path === APP_PATH || req.path.startsWith(`${APP_PATH}/`))
    ) {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexPath);
      return;
    }
    next();
  });

  return indexPath;
}
