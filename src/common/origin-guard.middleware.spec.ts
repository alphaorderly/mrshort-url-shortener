import { Request, Response } from 'express';
import { originGuard } from './origin-guard.middleware';

function run(method: string, headers: Record<string, string>) {
  const guard = originGuard();
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const req = {
    method,
    get: (name: string) => lower[name.toLowerCase()],
  } as Request;
  const json = jest.fn();
  const res = {
    status: jest.fn().mockReturnValue({ json }),
  } as unknown as Response;
  const next = jest.fn();
  guard(req, res, next);
  return { next, status: res.status as jest.Mock };
}

describe('originGuard', () => {
  it('읽기 요청은 항상 통과시킨다', () => {
    const { next } = run('GET', {
      Origin: 'https://evil.example',
      Host: 'a.com',
    });
    expect(next).toHaveBeenCalled();
  });

  it('같은 호스트에서 온 쓰기 요청은 통과시킨다', () => {
    const { next } = run('POST', {
      Origin: 'https://a.com',
      Host: 'a.com',
    });
    expect(next).toHaveBeenCalled();
  });

  it('다른 출처에서 온 쓰기 요청은 403 으로 막는다', () => {
    const { next, status } = run('DELETE', {
      Origin: 'https://evil.example',
      Host: 'a.com',
    });
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });

  it('Origin 이 "null" 이거나 깨져 있으면 막는다', () => {
    expect(
      run('POST', { Origin: 'null', Host: 'a.com' }).status,
    ).toHaveBeenCalledWith(403);
  });

  it('Origin 이 없어도 cross-site 로 표시된 요청은 막는다', () => {
    expect(
      run('POST', { 'Sec-Fetch-Site': 'cross-site', Host: 'a.com' }).status,
    ).toHaveBeenCalledWith(403);
  });

  it('Origin 과 Sec-Fetch-Site 가 모두 없는 요청(curl 등)은 통과시킨다', () => {
    expect(run('POST', { Host: 'a.com' }).next).toHaveBeenCalled();
  });
});
