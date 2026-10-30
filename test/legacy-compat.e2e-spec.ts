import { NestExpressApplication } from '@nestjs/platform-express';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import request from 'supertest';
import {
  createTestApp,
  LEGACY_SALT,
  pgClient,
  resetDatabase,
  resetRedis,
  useE2eEnv,
} from './helpers';

useE2eEnv();

const legacyHash = (password: string) =>
  createHash('sha256')
    .update(password + LEGACY_SALT)
    .digest('hex');

/**
 * 예전 버전(synchronize: true)이 만든 DB 와 데이터를 새 코드가 그대로 이어받는지 확인한다.
 */
describe('기존 DB 호환 (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;

  beforeAll(async () => {
    await resetDatabase(
      readFileSync(join(__dirname, 'fixtures', 'legacy-schema.sql'), 'utf8'),
    );
    await resetRedis();

    const client = pgClient();
    await client.connect();
    await client.query(
      `INSERT INTO "user" (username, password) VALUES ('oldadmin', $1)`,
      [legacyHash('legacy-pass')],
    );
    await client.query(
      `INSERT INTO shorten ("originalURL", "shortenedURL", "expiredAt", password, deleted, "userIDId") VALUES
        ('https://example.com/old', 'oldlink', NULL, NULL, false, 1),
        ('https://example.com/secret', 'oldsecret', NULL, $1, false, 1),
        ('https://example.com/gone', 'oldgone', now() - interval '3 days', NULL, true, 1)`,
      [legacyHash('hunter2')],
    );
    await client.query(
      `INSERT INTO click ("clickDate", "shortenId") VALUES (now(), 1), (now(), 1), (now(), 2)`,
    );
    await client.end();

    app = await createTestApp();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const passwordOf = async (username: string) => {
    const client = pgClient();
    await client.connect();
    const { rows } = await client.query<{ password: string }>(
      `SELECT password FROM "user" WHERE username = $1`,
      [username],
    );
    await client.end();
    return rows[0].password;
  };

  it('마이그레이션이 기존 테이블을 건드리지 않고 새 컬럼만 더한다', async () => {
    const client = pgClient();
    await client.connect();
    const users = await client.query(`SELECT count(*)::int AS n FROM "user"`);
    const columns = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'shorten'`,
    );
    const history = await client.query(
      `SELECT count(*)::int AS n FROM migrations`,
    );
    await client.end();

    expect(users.rows[0].n).toBe(1);
    expect(columns.rows.map((c) => c.column_name)).toContain('createdAt');
    expect(history.rows[0].n).toBe(2);
  });

  it('기존 계정의 SHA-256 비밀번호로 로그인하면 argon2 로 바뀐다', async () => {
    expect(await passwordOf('oldadmin')).toMatch(/^[0-9a-f]{64}$/);

    const agent = request.agent(http);
    await agent
      .post('/api/auth/login')
      .send({ username: 'oldadmin', password: 'wrong' })
      .expect(401);
    await agent
      .post('/api/auth/login')
      .send({ username: 'oldadmin', password: 'legacy-pass' })
      .expect(200);

    expect(await passwordOf('oldadmin')).toMatch(/^\$argon2id\$/);
    await agent
      .post('/api/auth/login')
      .send({ username: 'oldadmin', password: 'legacy-pass' })
      .expect(200);

    const list = await agent.get('/api/links').expect(200);
    expect(list.body.map((l: { code: string }) => l.code)).toEqual([
      'oldgone',
      'oldsecret',
      'oldlink',
    ]);
    const oldlink = list.body.find(
      (l: { code: string }) => l.code === 'oldlink',
    );
    expect(oldlink).toMatchObject({
      clickCount: 2,
      createdAt: null,
      expired: false,
      hasPassword: false,
    });
    expect(
      list.body.find((l: { code: string }) => l.code === 'oldgone').expired,
    ).toBe(true);
    expect(
      list.body.find((l: { code: string }) => l.code === 'oldsecret')
        .hasPassword,
    ).toBe(true);
  });

  it('기존 짧은 주소가 그대로 동작한다', async () => {
    await request(http)
      .get('/oldlink')
      .expect(302)
      .expect('Location', 'https://example.com/old');
    await request(http)
      .get('/oldsecret')
      .expect(302)
      .expect('Location', '/app/unlock/oldsecret');
    await request(http).get('/oldgone').expect(404);
  });

  it('기존 링크 비밀번호도 그대로 통하고 argon2 로 바뀐다', async () => {
    await request(http)
      .post('/api/links/oldsecret/unlock')
      .send({ password: 'nope' })
      .expect(403);
    const res = await request(http)
      .post('/api/links/oldsecret/unlock')
      .send({ password: 'hunter2' })
      .expect(200);
    expect(res.body.url).toBe('https://example.com/secret');

    const client = pgClient();
    await client.connect();
    const { rows } = await client.query<{ password: string }>(
      `SELECT password FROM shorten WHERE "shortenedURL" = 'oldsecret'`,
    );
    await client.end();
    expect(rows[0].password).toMatch(/^\$argon2id\$/);

    await request(http)
      .post('/api/links/oldsecret/unlock')
      .send({ password: 'hunter2' })
      .expect(200);
  });
});
