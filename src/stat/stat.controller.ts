import { Controller, Get, Render, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { StatService } from './stat.service';

@Controller('stat')
export class StatController {
  constructor(private readonly statService: StatService) {}

  @Get(':shortenedURL')
  @UseGuards(JwtAuthGuard)
  @Render('single-stat')
  async getStat(@Req() req) {
    const [clicks, shorten] = await this.statService.getStat(
      req.user.userId,
      req.params.shortenedURL,
    );

    return { clicks: JSON.stringify(clicks), shorten: JSON.stringify(shorten) };
  }
}
