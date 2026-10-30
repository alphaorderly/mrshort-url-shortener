import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { SessionUser } from '../common/request-types';
import { REDIS } from '../redis/redis.module';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { SessionService } from './session.service';

const MAX_FAILED_LOGINS = 10;
const LOCK_SECONDS = 15 * 60;

const failKey = (username: string) => `login:fail:${username.toLowerCase()}`;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async login(
    username: string,
    password: string,
  ): Promise<{ user: SessionUser; sid: string }> {
    const key = failKey(username);
    const failed = Number((await this.redis.get(key)) ?? 0);
    if (failed >= MAX_FAILED_LOGINS) {
      throw new HttpException(
        '로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const found = await this.users.findWithHashByUsername(username);
    const valid = found
      ? await this.passwords.verify(password, found.passwordHash)
      : false;

    if (!found || !valid) {
      if (!found) await this.passwords.verifyAgainstDummy(password);
      await this.redis.multi().incr(key).expire(key, LOCK_SECONDS).exec();
      throw new UnauthorizedException(
        '아이디 또는 비밀번호가 올바르지 않습니다.',
      );
    }

    await this.redis.del(key);

    const user: SessionUser = { id: found.id, username: found.username };
    const sid = await this.sessions.create(user);
    return { user, sid };
  }

  async changePassword(
    userId: number,
    currentSid: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const found = await this.users.findWithHashById(userId);
    const valid = found
      ? await this.passwords.verify(currentPassword, found.passwordHash)
      : false;

    if (!found || !valid) {
      throw new BadRequestException('현재 비밀번호가 일치하지 않습니다.');
    }

    await this.users.updatePasswordHash(
      userId,
      await this.passwords.hash(newPassword),
    );
    // 다른 기기에서 로그인된 세션은 모두 끊고 지금 세션만 유지한다.
    await this.sessions.destroyAllForUser(userId, currentSid);
  }
}
