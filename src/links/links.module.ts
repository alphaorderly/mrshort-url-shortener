import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Click } from './click.entity';
import { Link } from './link.entity';
import { LinksController } from './links.controller';
import { LinksService } from './links.service';
import { RedirectController } from './redirect.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Link, Click]), UsersModule],
  // RedirectController 의 `/:code` 는 가장 마지막에 등록되어야 한다.
  controllers: [LinksController, RedirectController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
