import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppConfig } from '../config/app.config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function hostOf(value: string): string | null {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

/**
 * 쿠키 기반 인증이므로 CSRF 를 막기 위해 상태를 바꾸는 요청의 출처를 검사한다.
 * 브라우저가 보내는 Origin(또는 Sec-Fetch-Site)이 같은 사이트가 아니면 거절한다.
 */
export function originGuard(config: AppConfig): RequestHandler {
  const trusted = new Set<string>();
  for (const origin of config.allowedOrigins) {
    const host = hostOf(origin);
    if (host) trusted.add(host);
  }

  const reject = (res: Response) => {
    res
      .status(403)
      .json({ statusCode: 403, message: '허용되지 않은 요청 출처입니다.' });
  };

  return (req: Request, res: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(req.method)) return next();

    const origin = req.get('origin');
    if (origin) {
      const originHost = hostOf(origin);
      const forwarded =
        config.trustProxy !== false
          ? req.get('x-forwarded-host')?.split(',')[0]?.trim()
          : undefined;
      const requestHost = forwarded || req.get('host');
      if (
        !originHost ||
        (originHost !== requestHost && !trusted.has(originHost))
      ) {
        return reject(res);
      }
    } else if (req.get('sec-fetch-site') === 'cross-site') {
      return reject(res);
    }
    next();
  };
}
