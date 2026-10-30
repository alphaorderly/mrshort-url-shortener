import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC } from '../common/public.decorator';
import { readSid } from './session-cookie';
import { SessionService } from './session.service';

/** 전역 가드. `@Public()` 이 붙지 않은 모든 라우트는 로그인이 필요하다. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const sid = readSid(req);
    const user = sid ? await this.sessions.get(sid) : null;

    if (!sid || !user) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    req.user = user;
    req.sid = sid;
    return true;
  }
}
