import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../common/public.decorator';
import { LinksService } from './links.service';

@Controller()
export class RedirectController {
  constructor(private readonly links: LinksService) {}

  @Public()
  @SkipThrottle()
  @Get(':code')
  async redirect(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.links.resolve(code, {
      countClick: req.method === 'GET',
    });

    res.setHeader('Cache-Control', 'no-store');
    if (result.type === 'password') {
      res.redirect(302, `/~/unlock/${encodeURIComponent(code)}`);
      return;
    }
    res.redirect(302, result.url);
  }
}
