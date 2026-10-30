import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Redis } from 'ioredis';
import { SessionUser } from '../common/request-types';
import { APP_CONFIG, AppConfig } from '../config/app.config';
import { REDIS } from '../redis/redis.module';

const sessionKey = (sid: string) => `sess:${sid}`;
const userSessionsKey = (userId: number) => `usess:${userId}`;

/** Redis 에 저장되는 서버 측 세션. 쿠키에는 추측할 수 없는 세션 id 만 담는다. */
@Injectable()
export class SessionService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async create(user: SessionUser): Promise<string> {
    const sid = randomBytes(32).toString('hex');
    const ttl = this.config.sessionTtlSeconds;

    await this.redis
      .multi()
      .set(sessionKey(sid), JSON.stringify(user), 'EX', ttl)
      .sadd(userSessionsKey(user.id), sid)
      .expire(userSessionsKey(user.id), ttl)
      .exec();

    return sid;
  }

  async get(sid: string): Promise<SessionUser | null> {
    const raw = await this.redis.get(sessionKey(sid));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }

  async destroy(sid: string): Promise<void> {
    const user = await this.get(sid);
    const pipeline = this.redis.multi().del(sessionKey(sid));
    if (user) pipeline.srem(userSessionsKey(user.id), sid);
    await pipeline.exec();
  }

  /** 비밀번호를 바꿨을 때처럼 한 사용자의 세션을 한꺼번에 끊는다. */
  async destroyAllForUser(userId: number, exceptSid?: string): Promise<void> {
    const sids = await this.redis.smembers(userSessionsKey(userId));
    const targets = sids.filter((sid) => sid !== exceptSid);
    if (targets.length === 0) return;

    await this.redis
      .multi()
      .del(...targets.map(sessionKey))
      .srem(userSessionsKey(userId), ...targets)
      .exec();
  }
}
