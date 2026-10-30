import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Redis } from 'ioredis';
import { join } from 'path';
import { Client } from 'pg';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { APP_CONFIG, AppConfig } from '../src/config/app.config';

export const ADMIN = { username: 'admin', password: 'admin-password-1' };
export const LEGACY_SALT = 'test-salt';

/** e2e 는 전용 DB/Redis 만 지우고 다시 만든다. 이름에 e2e 가 없으면 중단한다. */
export function useE2eEnv(): void {
  process.env.DB_HOST ??= 'localhost';
  process.env.DB_PORT ??= '5432';
  process.env.DB_USERNAME ??= 'mrshort';
  process.env.DB_PASSWORD ??= 'devpass';
  process.env.DB_DATABASE ??= 'mrshort_e2e';
  process.env.REDIS_HOST ??= 'localhost';
  process.env.REDIS_PORT ??= '6379';
  process.env.REDIS_PASSWORD ??= 'devpass';
  process.env.REDIS_DB ??= '15';
  process.env.THROTTLE_DISABLED = 'true';
  process.env.HASH_SALT = LEGACY_SALT;
  process.env.ADMIN_ID = ADMIN.username;
  process.env.ADMIN_PASSWORD = ADMIN.password;
  process.env.WEB_DIST = join(__dirname, 'fixtures', 'web');
  process.env.TARGET_URL = 'http://short.test/';

  if (!process.env.DB_DATABASE.includes('e2e')) {
    throw new Error(
      'e2e 테스트는 이름에 "e2e" 가 들어간 DB 에서만 실행할 수 있습니다.',
    );
  }
}

export function pgClient(): Client {
  return new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
}

export async function resetDatabase(schemaSql?: string): Promise<void> {
  const client = pgClient();
  await client.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    if (schemaSql) await client.query(schemaSql);
  } finally {
    await client.end();
  }
}

export async function resetRedis(): Promise<void> {
  const redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    db: Number(process.env.REDIS_DB),
  });
  await redis.flushdb();
  await redis.quit();
}

export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    logger: ['error'],
  });
  configureApp(app, app.get<AppConfig>(APP_CONFIG));
  await app.init();
  return app;
}

export async function waitFor<T>(
  probe: () => Promise<T | undefined | false>,
  timeoutMs = 3000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await probe();
    if (value) return value;
    if (Date.now() > deadline) throw new Error('waitFor: 시간 초과');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
