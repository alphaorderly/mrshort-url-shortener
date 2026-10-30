import { Body, Controller, Inject, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { setSessionCookie } from '../auth/session-cookie';
import { SessionService } from '../auth/session.service';
import { Public } from '../common/public.decorator';
import { SessionUser } from '../common/request-types';
import { APP_CONFIG, AppConfig } from '../config/app.config';
import { RegisterDto } from './invites.dto';
import { InvitesService } from './invites.service';

@Controller('api/register')
export class RegisterController {
  constructor(
    private readonly invites: InvitesService,
    private readonly sessions: SessionService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Public()
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionUser> {
    const user = await this.invites.register(dto);
    const sid = await this.sessions.create(user);
    setSessionCookie(res, sid, this.config);
    return user;
  }
}
