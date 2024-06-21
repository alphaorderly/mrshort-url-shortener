import { Module } from '@nestjs/common';
import { StatController } from './stat.controller';
import { StatService } from './stat.service';
import { Click } from 'src/entities/click.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shorten } from 'src/entities/shorten.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Click, Shorten])],
  controllers: [StatController],
  providers: [StatService],
})
export class StatModule {}
