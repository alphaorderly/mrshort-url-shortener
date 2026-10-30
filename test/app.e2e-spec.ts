import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import {
  ADMIN,
  createTestApp,
  pgClient,
  resetDatabase,
  resetRedis,
  useE2eEnv,
  waitFor,
} from './helpers';

useE2eEnv();

describe('MrShort API (e2e)', () => {
  let app: NestExpressApplication;
  let http: ReturnType<NestExpressApplication['getHttpServer']>;
  let admin: TestAgent;

  const login = async (username: string, password: string) => {
    const agent = request.agent(http);
    const res = await agent
      .post('/api/auth/login')
      .send({ username, password });
    return { agent, res };
  };

  beforeAll(async () => {
    await resetDatabase();
    await resetRedis();
    app = await createTestApp();
    http = app.getHttpServer();
    admin = (await login(ADMIN.username, ADMIN.password)).agent;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('meta', () => {
    it('헬스체크와 공개 설정을 돌려준다', async () => {
      await request(http).get('/api/health').expect(200, { status: 'ok' });
      const res = await request(http).get('/api/config').expect(200);
      expect(res.body).toEqual({
        serviceName: 'MrShort',
        baseUrl: 'http://short.test/',
      });
    });

    it('보안 헤더를 붙이고 서버 정보를 숨긴다', async () => {
      const res = await request(http).get('/api/health');
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['content-security-policy']).toContain(
        "default-src 'self'",
      );
      expect(res.headers['content-security-policy']).not.toContain(
        'upgrade-insecure-requests',
      );
    });
  });

  describe('인증', () => {
    it('로그인 없이는 보호된 API 를 쓸 수 없다', async () => {
      await request(http).get('/api/links').expect(401);
      await request(http).get('/api/auth/me').expect(200, { user: null });
      await request(http)
        .post('/api/links')
        .send({ url: 'https://a.com' })
        .expect(401);
      await request(http).post('/api/invites').expect(401);
    });

    it('잘못된 비밀번호는 401, 존재하지 않는 계정도 같은 응답이다', async () => {
      const wrong = await login(ADMIN.username, 'nope');
      const ghost = await login('ghost', 'nope');
      expect(wrong.res.status).toBe(401);
      expect(ghost.res.status).toBe(401);
      expect(ghost.res.body.message).toBe(wrong.res.body.message);
    });

    it('로그인하면 httpOnly 세션 쿠키를 주고 비밀번호 해시는 노출하지 않는다', async () => {
      const { res } = await login(ADMIN.username, ADMIN.password);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: expect.any(Number),
        username: ADMIN.username,
      });
      const cookie = (res.headers['set-cookie'] as unknown as string[]).join(
        ';',
      );
      expect(cookie).toMatch(/sid=[a-f0-9]{64}/);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
      await admin
        .get('/api/auth/me')
        .expect(200, { user: { id: res.body.id, username: ADMIN.username } });
    });

    it('같은 계정으로 10번 실패하면 잠긴다', async () => {
      await resetRedisKeys();
      for (let i = 0; i < 10; i += 1) {
        await request(http)
          .post('/api/auth/login')
          .send({ username: 'victim', password: 'x' });
      }
      await request(http)
        .post('/api/auth/login')
        .send({ username: 'victim', password: 'x' })
        .expect(429);
    });

    it('다른 출처에서 온 상태 변경 요청은 거절한다 (CSRF)', async () => {
      await admin
        .post('/api/links')
        .set('Origin', 'https://evil.example')
        .send({ url: 'https://example.com' })
        .expect(403);
      await admin
        .post('/api/links')
        .set('Sec-Fetch-Site', 'cross-site')
        .send({ url: 'https://example.com' })
        .expect(403);
    });
  });

  describe('링크', () => {
    it('링크를 만들면 비밀번호 해시 없이 돌려준다', async () => {
      const res = await admin
        .post('/api/links')
        .send({ url: 'https://example.com/path?q=1', password: 'secret' })
        .expect(201);
      expect(res.body.code).toMatch(/^[A-Za-z0-9]{7}$/);
      expect(res.body.hasPassword).toBe(true);
      expect(JSON.stringify(res.body)).not.toMatch(
        /argon2|passwordHash|"password"/,
      );
    });

    it.each([
      ['javascript: 스킴', { url: 'javascript:alert(1)' }],
      ['ftp 스킴', { url: 'ftp://example.com/file' }],
      ['스킴 없음', { url: 'example.com' }],
      ['예약된 주소', { url: 'https://example.com', code: 'api' }],
      ['따옴표가 들어간 주소', { url: 'https://example.com', code: 'a"b' }],
      [
        '과거 만료 시각',
        { url: 'https://example.com', expiresAt: '2020-01-01T00:00:00Z' },
      ],
      ['알 수 없는 필드', { url: 'https://example.com', admin: true }],
    ])('잘못된 입력은 400: %s', async (_name, body) => {
      const res = await admin.post('/api/links').send(body).expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('한글 사용자 지정 주소를 만들 수 있고 중복은 409 이다', async () => {
      await admin
        .post('/api/links')
        .send({ url: 'https://example.com/kr', code: '한글링크' })
        .expect(201);
      await admin
        .post('/api/links')
        .send({ url: 'https://example.com/other', code: '한글링크' })
        .expect(409);
      await request(http)
        .get(`/${encodeURIComponent('한글링크')}`)
        .expect(302)
        .expect('Location', 'https://example.com/kr');
    });

    it('리다이렉트하고 클릭을 기록한다', async () => {
      const created = await admin
        .post('/api/links')
        .send({ url: 'https://example.com/go', code: 'go-link' })
        .expect(201);

      await request(http)
        .get('/go-link')
        .expect(302)
        .expect('Location', 'https://example.com/go');
      await request(http).get('/go-link').expect(302);
      await request(http).head('/go-link').expect(302);

      const link = await waitFor(async () => {
        const list = await admin.get('/api/links').expect(200);
        const found = list.body.find(
          (l: { code: string }) => l.code === 'go-link',
        );
        return found?.clickCount === 2 ? found : undefined;
      });
      expect(link.id).toBe(created.body.id);
    });

    it('통계는 30일치 일별 집계와 합계를 준다', async () => {
      const res = await admin.get('/api/links/go-link/stats').expect(200);
      expect(res.body.total).toBe(2);
      expect(res.body.last30).toBe(2);
      expect(res.body.daily).toHaveLength(30);
      expect(res.body.recent).toHaveLength(2);
      expect(res.body.link.code).toBe('go-link');
    });

    it('비밀번호 링크는 잠금 화면으로 보내고, 올바른 비밀번호일 때만 주소를 준다', async () => {
      await admin
        .post('/api/links')
        .send({
          url: 'https://example.com/private',
          code: 'locked',
          password: 'open-sesame',
        })
        .expect(201);

      await request(http)
        .get('/locked')
        .expect(302)
        .expect('Location', '/app/unlock/locked');
      await request(http)
        .post('/api/links/locked/unlock')
        .send({ password: 'wrong' })
        .expect(403);
      const ok = await request(http)
        .post('/api/links/locked/unlock')
        .send({ password: 'open-sesame' })
        .expect(200);
      expect(ok.body).toEqual({ url: 'https://example.com/private' });
    });

    it('만료된 링크와 없는 링크는 404 화면을 준다', async () => {
      await admin
        .post('/api/links')
        .send({
          url: 'https://example.com/soon',
          code: 'soon',
          expiresAt: new Date(Date.now() + 60_000).toISOString(),
        })
        .expect(201);
      await request(http).get('/soon').expect(302);

      const client = pgClient();
      await client.connect();
      await client.query(
        `UPDATE shorten SET "expiredAt" = now() - interval '1 hour' WHERE "shortenedURL" = 'soon'`,
      );
      await client.end();
      await resetRedisKeys('link:soon');

      const gone = await request(http).get('/soon').expect(404);
      expect(gone.headers['content-type']).toMatch(/html/);
      await request(http)
        .get('/does-not-exist')
        .expect(404)
        .expect('Content-Type', /html/);

      const list = await admin.get('/api/links').expect(200);
      expect(
        list.body.find((l: { code: string }) => l.code === 'soon').expired,
      ).toBe(true);
    });

    it('다른 사용자의 링크는 보이지 않고 지울 수도 없다', async () => {
      const invite = await admin.post('/api/invites').expect(201);
      const other = request.agent(http);
      await other
        .post('/api/register')
        .send({
          token: invite.body.token,
          username: 'other.user',
          password: 'other-password',
        })
        .expect(201);

      expect((await other.get('/api/links').expect(200)).body).toEqual([]);
      await other.delete('/api/links/go-link').expect(404);
      await other.get('/api/links/go-link/stats').expect(404);
    });

    it('삭제하면 캐시까지 지워져 바로 404 가 된다', async () => {
      await request(http).get('/go-link').expect(302);
      await admin.delete('/api/links/go-link').expect(204);
      await request(http).get('/go-link').expect(404);
      await admin.delete('/api/links/go-link').expect(404);
    });
  });

  describe('초대 가입', () => {
    it('초대 토큰 없이는 가입할 수 없다', async () => {
      const bogus = 'a'.repeat(32);
      await request(http)
        .post('/api/register')
        .send({
          token: bogus,
          username: 'intruder',
          password: 'intruder-password',
        })
        .expect(410);
      await request(http)
        .post('/api/register')
        .send({ username: 'intruder', password: 'intruder-password' })
        .expect(400);
      await request(http).get(`/api/invites/${bogus}`).expect(404);
    });

    it('초대 토큰은 한 번만 쓸 수 있고 가입하면 바로 로그인된다', async () => {
      const invite = await admin.post('/api/invites').expect(201);
      expect(invite.body.token).toMatch(/^[A-Za-z0-9_-]{32}$/);
      await request(http).get(`/api/invites/${invite.body.token}`).expect(204);

      const agent = request.agent(http);
      const res = await agent
        .post('/api/register')
        .send({
          token: invite.body.token,
          username: 'newbie',
          password: 'newbie-password',
        })
        .expect(201);
      expect(JSON.stringify(res.body)).not.toMatch(/argon2|password/i);
      await agent.get('/api/auth/me').expect(200);

      await request(http)
        .post('/api/register')
        .send({
          token: invite.body.token,
          username: 'second',
          password: 'second-password',
        })
        .expect(410);
    });

    it('이미 있는 아이디로는 가입할 수 없고 초대 링크는 유지된다', async () => {
      const invite = await admin.post('/api/invites').expect(201);
      await request(http)
        .post('/api/register')
        .send({
          token: invite.body.token,
          username: ADMIN.username,
          password: 'whatever-password',
        })
        .expect(409);
      await request(http).get(`/api/invites/${invite.body.token}`).expect(204);
    });

    it('비밀번호와 아이디 규칙을 검증한다', async () => {
      const invite = await admin.post('/api/invites').expect(201);
      const res = await request(http)
        .post('/api/register')
        .send({ token: invite.body.token, username: 'a b', password: 'short' })
        .expect(400);
      expect(Object.keys(res.body.errors)).toEqual(
        expect.arrayContaining(['username', 'password']),
      );
    });
  });

  describe('비밀번호 변경과 로그아웃', () => {
    it('현재 비밀번호가 틀리면 400, 맞으면 다른 세션을 끊는다', async () => {
      const first = await login(ADMIN.username, ADMIN.password);
      const second = await login(ADMIN.username, ADMIN.password);

      await first.agent
        .post('/api/auth/password')
        .send({ currentPassword: 'wrong', newPassword: 'brand-new-password' })
        .expect(400);
      await first.agent
        .post('/api/auth/password')
        .send({
          currentPassword: ADMIN.password,
          newPassword: 'brand-new-password',
        })
        .expect(204);

      await first.agent.get('/api/auth/me').expect(200);
      await second.agent.get('/api/auth/me').expect(200, { user: null });

      expect((await login(ADMIN.username, ADMIN.password)).res.status).toBe(
        401,
      );
      const relogin = await login(ADMIN.username, 'brand-new-password');
      expect(relogin.res.status).toBe(200);
      admin = relogin.agent;
    });

    it('로그아웃하면 세션이 사라진다', async () => {
      const { agent } = await login(ADMIN.username, 'brand-new-password');
      await agent.post('/api/auth/logout').expect(204);
      await agent.get('/api/auth/me').expect(200, { user: null });
      await agent.get('/api/links').expect(401);
    });
  });

  describe('프론트엔드 호스팅', () => {
    it('/app 하위 경로는 index.html 을 준다', async () => {
      const res = await request(http).get('/app/stats/abc').expect(200);
      expect(res.text).toContain('<div id="root">');
      await request(http).get('/assets/app.js').expect(200);
    });

    it('/api 의 없는 경로는 JSON 404 이다', async () => {
      const res = await request(http).get('/api/nothing').expect(404);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('예전 서버 렌더링 주소는 새 화면으로 보낸다', async () => {
      await request(http)
        .get('/stat/abc')
        .expect(302)
        .expect('Location', '/app/stats/abc');
      await request(http)
        .get('/register/url/some-token')
        .expect(302)
        .expect('Location', '/app/register/some-token');
      await request(http)
        .get('/auth/change-password')
        .expect(302)
        .expect('Location', '/app/account');
    });
  });

  async function resetRedisKeys(pattern = 'login:fail:*') {
    const { Redis } = await import('ioredis');
    const redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB),
    });
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
    await redis.quit();
  }
});
