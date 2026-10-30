import { createHash } from 'crypto';
import { PasswordService } from './password.service';

const service = new PasswordService();

describe('PasswordService', () => {
  it('argon2id 로 해시하고 검증한다', async () => {
    const hash = await service.hash('correct horse');
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await service.verify('correct horse', hash)).toBe(true);
    expect(await service.verify('wrong', hash)).toBe(false);
  });

  it('같은 비밀번호도 매번 다른 해시가 나온다 (사용자별 솔트)', async () => {
    expect(await service.hash('same')).not.toBe(await service.hash('same'));
  });

  it('argon2 가 아닌 저장값은 예외 없이 실패로 처리한다', async () => {
    const sha256 = createHash('sha256').update('hunter2').digest('hex');
    expect(await service.verify('hunter2', sha256)).toBe(false);
    expect(await service.verify('x', 'not-a-hash')).toBe(false);
    expect(await service.verify('x', '')).toBe(false);
  });
});
