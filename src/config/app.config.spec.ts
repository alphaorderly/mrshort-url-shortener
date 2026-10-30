import { loadConfig } from './app.config';

const base: NodeJS.ProcessEnv = {
  DB_HOST: 'db',
  DB_USERNAME: 'u',
  DB_PASSWORD: 'p',
  DB_DATABASE: 'd',
  REDIS_HOST: 'redis',
};

describe('loadConfig', () => {
  it('필수 값이 없으면 어떤 값이 빠졌는지 알려 준다', () => {
    expect(() => loadConfig({})).toThrow(
      /DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE, REDIS_HOST/,
    );
  });

  it('기본값을 채운다', () => {
    const config = loadConfig(base);
    expect(config).toMatchObject({
      port: 3000,
      serviceName: 'MrShort',
      trustProxy: false,
      cookieSecure: 'auto',
      sessionTtlSeconds: 30 * 24 * 60 * 60,
      admin: null,
      db: { host: 'db', port: 5432 },
      redis: { host: 'redis', port: 6379, db: 0 },
    });
  });

  it('예전 ID/PW 환경변수도 관리자 계정으로 읽는다', () => {
    expect(loadConfig({ ...base, ID: 'a', PW: 'b' }).admin).toEqual({
      username: 'a',
      password: 'b',
    });
    expect(
      loadConfig({
        ...base,
        ID: 'a',
        PW: 'b',
        ADMIN_ID: 'x',
        ADMIN_PASSWORD: 'y',
      }).admin,
    ).toEqual({ username: 'x', password: 'y' });
    expect(loadConfig({ ...base, ID: 'a' }).admin).toBeNull();
    // 새 이름이 빈 문자열로 넘어와도 예전 이름을 쓴다.
    expect(
      loadConfig({
        ...base,
        ADMIN_ID: '',
        ADMIN_PASSWORD: '',
        ID: 'a',
        PW: 'b',
      }).admin,
    ).toEqual({ username: 'a', password: 'b' });
  });

  it.each([
    ['true', true],
    ['false', false],
    ['1', 1],
    ['loopback, 10.0.0.0/8', 'loopback, 10.0.0.0/8'],
    ['', false],
  ])('TRUST_PROXY=%j', (raw, expected) => {
    expect(loadConfig({ ...base, TRUST_PROXY: raw }).trustProxy).toBe(expected);
  });

  it('숫자 값이 잘못되면 거절한다', () => {
    expect(() => loadConfig({ ...base, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => loadConfig({ ...base, DB_PORT: '-1' })).toThrow(/DB_PORT/);
  });
});
