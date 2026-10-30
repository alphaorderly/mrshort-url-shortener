import {
  ConflictException,
  GoneException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Redis } from 'ioredis';
import { isUniqueViolation } from '../common/db-errors';
import { SessionUser } from '../common/request-types';
import { REDIS } from '../redis/redis.module';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './invites.dto';

export const INVITE_TTL_SECONDS = 24 * 60 * 60;
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{16,64}$/;
const INVALID_INVITE = '유효하지 않거나 만료된 초대 링크입니다.';

const inviteKey = (token: string) => `invite:${token}`;

@Injectable()
export class InvitesService {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    private readonly users: UsersService,
  ) {}

  async create(userId: number): Promise<{ token: string; expiresAt: string }> {
    const token = randomBytes(24).toString('base64url');
    await this.redis.set(
      inviteKey(token),
      String(userId),
      'EX',
      INVITE_TTL_SECONDS,
    );
    return {
      token,
      expiresAt: new Date(Date.now() + INVITE_TTL_SECONDS * 1000).toISOString(),
    };
  }

  async exists(token: string): Promise<boolean> {
    if (!TOKEN_FORMAT.test(token)) return false;
    return (await this.redis.exists(inviteKey(token))) === 1;
  }

  /** 초대 링크는 한 번만 쓸 수 있다. DEL 의 반환값으로 동시에 쓰려는 요청 중 한 명만 통과시킨다. */
  private async consume(token: string): Promise<boolean> {
    if (!TOKEN_FORMAT.test(token)) return false;
    return (await this.redis.del(inviteKey(token))) === 1;
  }

  async register(dto: RegisterDto): Promise<SessionUser> {
    if (!(await this.exists(dto.token)))
      throw new GoneException(INVALID_INVITE);

    if (await this.users.usernameExists(dto.username)) {
      throw new ConflictException('이미 존재하는 아이디입니다.');
    }

    const remainingMs = await this.redis.pttl(inviteKey(dto.token));
    if (!(await this.consume(dto.token)))
      throw new GoneException(INVALID_INVITE);

    try {
      const user = await this.users.create(dto.username, dto.password);
      return { id: user.id, username: user.username };
    } catch (error) {
      // 가입에 실패했으면 초대 링크를 되돌려 다시 시도할 수 있게 한다.
      // 남은 유효 시간은 그대로 두어, 실패할 때마다 만료가 늘어나지 않게 한다.
      if (remainingMs > 0) {
        await this.redis.set(inviteKey(dto.token), '0', 'PX', remainingMs);
      }
      if (isUniqueViolation(error)) {
        throw new ConflictException('이미 존재하는 아이디입니다.');
      }
      throw error;
    }
  }
}
