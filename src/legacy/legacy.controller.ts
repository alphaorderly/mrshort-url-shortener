import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../common/public.decorator';

/** 예전 서버 렌더링 시절의 주소로 들어온 요청을 새 화면으로 보낸다. */
@Controller()
export class LegacyController {
  @Public()
  @Get('register/url/:token')
  register(@Param('token') token: string, @Res() res: Response) {
    res.redirect(302, `/app/register/${encodeURIComponent(token)}`);
  }

  @Public()
  @Get('stat/:code')
  stat(@Param('code') code: string, @Res() res: Response) {
    res.redirect(302, `/app/stats/${encodeURIComponent(code)}`);
  }

  @Public()
  @Get('auth/change-password')
  changePassword(@Res() res: Response) {
    res.redirect(302, '/app/account');
  }
}
