import { Request, Response } from 'express';
import { AppConfig } from '../config/app.config';

export const SESSION_COOKIE = 'sid';

const SID_FORMAT = /^[a-f0-9]{64}$/;

export function readSid(req: Request): string | undefined {
  const value: unknown = req.cookies?.[SESSION_COOKIE];
  return typeof value === 'string' && SID_FORMAT.test(value)
    ? value
    : undefined;
}

export function setSessionCookie(
  res: Response,
  sid: string,
  config: AppConfig,
): void {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: config.sessionTtlSeconds * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}
