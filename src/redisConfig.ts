import { RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import dotenv from 'dotenv';

dotenv.config();

export const redisConfig: RedisModuleOptions = {
  readyLog: true,
  config: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
    password: process.env.REDIS_PASSWORD,
    namespace: 'Redis',
  },
};
