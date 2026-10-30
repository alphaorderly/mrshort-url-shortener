import { Inject, Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import { createHash, timingSafeEqual } from 'crypto';
import { APP_CONFIG, AppConfig } from '../config/app.config';

export interface PasswordCheck {
  valid: boolean;
  /** 예전 SHA-256 해시로 검증된 경우 true. 호출한 쪽이 argon2 해시로 교체해야 한다. */
  needsRehash: boolean;
}

const LEGACY_HASH = /^[0-9a-f]{64}$/;

@Injectable()
export class PasswordService {
  private dummyHash?: Promise<string>;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  hash(password: string): Promise<string> {
    return hash(password);
  }

  async verify(password: string, stored: string): Promise<PasswordCheck> {
    if (LEGACY_HASH.test(stored)) {
      const candidate = createHash('sha256')
        .update(password + this.config.legacyHashSalt)
        .digest();
      const expected = Buffer.from(stored, 'hex');
      const valid = timingSafeEqual(candidate, expected);
      return { valid, needsRehash: valid };
    }

    try {
      return { valid: await verify(stored, password), needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  /** 존재하지 않는 계정에도 같은 시간이 걸리도록 더미 검증을 수행한다. */
  async verifyAgainstDummy(password: string): Promise<void> {
    this.dummyHash ??= this.hash('dummy-password-for-timing');
    await this.verify(password, await this.dummyHash);
  }
}
