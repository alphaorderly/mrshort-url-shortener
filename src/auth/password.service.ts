import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

@Injectable()
export class PasswordService {
  private dummyHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return hash(password);
  }

  /** 저장된 값의 형식이 이상해도 예외 없이 false 를 돌려준다. */
  async verify(password: string, stored: string): Promise<boolean> {
    try {
      return await verify(stored, password);
    } catch {
      return false;
    }
  }

  /** 존재하지 않는 계정에도 같은 시간이 걸리도록 더미 검증을 수행한다. */
  async verifyAgainstDummy(password: string): Promise<void> {
    this.dummyHash ??= this.hash('dummy-password-for-timing');
    await this.verify(password, await this.dummyHash);
  }
}
