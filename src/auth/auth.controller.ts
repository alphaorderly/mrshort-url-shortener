import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';
import { SessionUser } from '../common/request-types';
import { APP_CONFIG, AppConfig } from '../config/app.config';
import { ChangePasswordDto, LoginDto } from './auth.dto';
import { AuthService } from './auth.service';
import {
  clearSessionCookie,
  readSid,
  setSessionCookie,
} from './session-cookie';
import { SessionService } from './session.service';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionUser> {
    const { user, sid } = await this.auth.login(dto.username, dto.password);
    setSessionCookie(res, sid, this.config);
    return user;
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const sid = readSid(req);
    if (sid) await this.sessions.destroy(sid);
    clearSessionCookie(res);
  }

  /** 로그인 상태 확인. 로그인하지 않았어도 오류가 아니라 `{ user: null }` 로 답한다. */
  @Public()
  @Get('me')
  async me(@Req() req: Request): Promise<{ user: SessionUser | null }> {
    const sid = readSid(req);
    return { user: sid ? await this.sessions.get(sid) : null };
  }

  @Post('password')
  @HttpCode(204)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async changePassword(
    @CurrentUser() user: SessionUser,
    @Req() req: Request,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(
      user.id,
      req.sid as string,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
