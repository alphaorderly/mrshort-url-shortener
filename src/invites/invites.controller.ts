import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';
import { SessionUser } from '../common/request-types';
import { InvitesService } from './invites.service';

@Controller('api/invites')
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}

  @Post()
  create(@CurrentUser() user: SessionUser) {
    return this.invites.create(user.id);
  }

  /** 가입 화면을 보여주기 전에 초대 링크가 아직 유효한지 확인한다. */
  @Public()
  @Get(':token')
  @HttpCode(204)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async check(@Param('token') token: string): Promise<void> {
    if (!(await this.invites.exists(token))) {
      throw new NotFoundException('유효하지 않거나 만료된 초대 링크입니다.');
    }
  }
}
