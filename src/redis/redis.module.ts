import {
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { APP_CONFIG, AppConfig } from '../config/app.config';

export const REDIS = Symbol('REDIS');

@Injectable()
class RedisLifecycle implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit().catch(() => this.redis.disconnect());
  }
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => {
        const logger = new Logger('Redis');
        const redis = new Redis({
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
          db: config.redis.db,
          maxRetriesPerRequest: 2,
        });
        redis.on('error', (error) => logger.error(error.message));
        return redis;
      },
    },
    RedisLifecycle,
  ],
  exports: [REDIS],
})
export class RedisModule {}
