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
      sessionTtlSeconds: 30 * 24 * 60 * 60,
      admin: null,
      db: { host: 'db', port: 5432 },
      redis: { host: 'redis', port: 6379, db: 0 },
    });
  });

  it('ADMIN_ID 와 ADMIN_PASSWORD 가 둘 다 있을 때만 관리자 계정을 만든다', () => {
    expect(
      loadConfig({ ...base, ADMIN_ID: 'x', ADMIN_PASSWORD: 'y' }).admin,
    ).toEqual({ username: 'x', password: 'y' });
    expect(loadConfig({ ...base, ADMIN_ID: 'x' }).admin).toBeNull();
    expect(
      loadConfig({ ...base, ADMIN_ID: '', ADMIN_PASSWORD: '' }).admin,
    ).toBeNull();
  });

  it('숫자 값이 잘못되면 거절한다', () => {
    expect(() => loadConfig({ ...base, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => loadConfig({ ...base, DB_PORT: '-1' })).toThrow(/DB_PORT/);
  });
});
