import { createHash } from 'crypto';
import { AppConfig } from '../config/app.config';
import { PasswordService } from './password.service';

const service = new PasswordService({ legacyHashSalt: 'salt' } as AppConfig);
const legacy = (password: string, salt = 'salt') =>
  createHash('sha256')
    .update(password + salt)
    .digest('hex');

describe('PasswordService', () => {
  it('argon2id 로 해시하고 검증한다', async () => {
    const hash = await service.hash('correct horse');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await service.verify('correct horse', hash)).toEqual({
      valid: true,
      needsRehash: false,
    });
    expect(await service.verify('wrong', hash)).toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it('같은 비밀번호도 매번 다른 해시가 나온다 (사용자별 솔트)', async () => {
    expect(await service.hash('same')).not.toBe(await service.hash('same'));
  });

  it('예전 SHA-256 해시를 검증하고 재해시가 필요하다고 알려 준다', async () => {
    expect(await service.verify('hunter2', legacy('hunter2'))).toEqual({
      valid: true,
      needsRehash: true,
    });
    expect(await service.verify('nope', legacy('hunter2'))).toEqual({
      valid: false,
      needsRehash: false,
    });
  });

  it('솔트가 다르면 예전 해시도 통과하지 못한다', async () => {
    const other = legacy('hunter2', 'other-salt');
    expect((await service.verify('hunter2', other)).valid).toBe(false);
  });

  it('형식이 이상한 저장값은 예외 없이 실패로 처리한다', async () => {
    expect(await service.verify('x', 'not-a-hash')).toEqual({
      valid: false,
      needsRehash: false,
    });
    expect(await service.verify('x', '')).toEqual({
      valid: false,
      needsRehash: false,
    });
  });
});
