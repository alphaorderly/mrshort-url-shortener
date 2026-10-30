import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';
import { SessionUser } from '../common/request-types';
import { CreateLinkDto, UnlockLinkDto } from './links.dto';
import { LinksService, LinkStats, LinkView } from './links.service';

@Controller('api/links')
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Get()
  list(@CurrentUser() user: SessionUser): Promise<LinkView[]> {
    return this.links.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateLinkDto,
  ): Promise<LinkView> {
    return this.links.create(user.id, dto);
  }

  @Get(':code/stats')
  stats(
    @CurrentUser() user: SessionUser,
    @Param('code') code: string,
  ): Promise<LinkStats> {
    return this.links.stats(user.id, code);
  }

  @Delete(':code')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: SessionUser,
    @Param('code') code: string,
  ): Promise<void> {
    await this.links.remove(user.id, code);
  }

  /** 비밀번호가 걸린 링크를 열어 원래 주소를 돌려준다. 무차별 대입을 막기 위해 호출 횟수를 제한한다. */
  @Public()
  @Post(':code/unlock')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async unlock(
    @Param('code') code: string,
    @Body() dto: UnlockLinkDto,
  ): Promise<{ url: string }> {
    return { url: await this.links.unlock(code, dto.password) };
  }
}
