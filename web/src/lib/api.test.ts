import { api, ApiError, setUnauthorizedHandler } from './api';

function respond(status: number, body?: unknown) {
  return Promise.resolve(
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('api', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    setUnauthorizedHandler(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('JSON 본문과 쿠키 설정으로 요청한다', async () => {
    fetchMock.mockReturnValue(respond(201, { id: 1 }));
    await api.createLink({ url: 'https://a.com' });

    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/links');
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://a.com' }),
    });
  });

  it('204 는 빈 값으로 처리한다', async () => {
    fetchMock.mockReturnValue(respond(204));
    await expect(api.deleteLink('abc')).resolves.toBeUndefined();
  });

  it('코드를 URL 에 맞게 인코딩한다', async () => {
    fetchMock.mockReturnValue(respond(204));
    await api.deleteLink('팀/핸드북');
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/links/${encodeURIComponent('팀/핸드북')}`);
  });

  it('서버의 한글 메시지와 항목별 오류를 ApiError 로 돌려준다', async () => {
    fetchMock.mockReturnValue(
      respond(400, { message: '입력값을 확인해 주세요.', errors: { url: ['주소가 올바르지 않습니다.'] } }),
    );
    const error = await api.createLink({ url: 'x' }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: '입력값을 확인해 주세요.',
      fields: { url: ['주소가 올바르지 않습니다.'] },
    });
  });

  it('한글이 아닌 서버 메시지는 상태에 맞는 안내문으로 바꾼다', async () => {
    fetchMock.mockReturnValue(respond(429, { message: 'ThrottlerException: Too Many Requests' }));
    await expect(api.links()).rejects.toMatchObject({
      status: 429,
      message: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
    });

    fetchMock.mockReturnValue(respond(500, { message: 'Internal server error' }));
    await expect(api.links()).rejects.toMatchObject({
      message: '서버에 문제가 생겼습니다. 잠시 후 다시 시도하세요.',
    });
  });

  it('네트워크 오류는 상태 0 의 ApiError 이다', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(api.links()).rejects.toMatchObject({ status: 0 });
  });

  it('보호된 요청이 401 을 받으면 세션 만료 핸들러를 부른다', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockReturnValue(respond(401, { message: '로그인이 필요합니다.' }));

    await expect(api.links()).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('로그인 실패(401)는 세션 만료로 취급하지 않는다', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockReturnValue(respond(401, { message: '아이디 또는 비밀번호가 올바르지 않습니다.' }));

    await expect(api.login('a', 'b')).rejects.toMatchObject({
      message: '아이디 또는 비밀번호가 올바르지 않습니다.',
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('me 는 로그인하지 않았으면 null 을 돌려준다', async () => {
    fetchMock.mockReturnValue(respond(200, { user: null }));
    await expect(api.me()).resolves.toBeNull();

    fetchMock.mockReturnValue(respond(200, { user: { id: 1, username: 'admin' } }));
    await expect(api.me()).resolves.toEqual({ id: 1, username: 'admin' });
  });

  it('checkInvite 는 404 를 false 로 바꾼다', async () => {
    fetchMock.mockReturnValue(respond(404, { message: '유효하지 않거나 만료된 초대 링크입니다.' }));
    await expect(api.checkInvite('t')).resolves.toBe(false);

    fetchMock.mockReturnValue(respond(204));
    await expect(api.checkInvite('t')).resolves.toBe(true);
  });
});
