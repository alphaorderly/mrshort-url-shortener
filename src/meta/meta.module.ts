import { Module } from '@nestjs/common';
import { LegacyController } from '../legacy/legacy.controller';
import { MetaController } from './meta.controller';

@Module({
  controllers: [MetaController, LegacyController],
})
export class MetaModule {}
