import {
  Controller,
  Get,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Redis } from 'ioredis';
import { DataSource } from 'typeorm';
import { Public } from '../common/public.decorator';
import { APP_CONFIG, AppConfig } from '../config/app.config';
import { REDIS } from '../redis/redis.module';

@Controller('api')
export class MetaController {
  private readonly logger = new Logger(MetaController.name);

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Get('config')
  getConfig() {
    return { serviceName: this.config.serviceName };
  }

  @Public()
  @SkipThrottle()
  @Get('health')
  async health() {
    try {
      await this.dataSource.query('SELECT 1');
      await this.redis.ping();
      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`health check failed: ${(error as Error).message}`);
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }
  }
}
