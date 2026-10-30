import {
  CODE_PATTERN,
  generateCode,
  isHttpUrl,
  isReservedCode,
  normalizeCode,
} from './code.util';

describe('code.util', () => {
  it('지정한 길이의 영숫자 코드를 만든다', () => {
    const code = generateCode();
    expect(code).toMatch(/^[A-Za-z0-9]{7}$/);
    expect(generateCode(12)).toHaveLength(12);
  });

  it('충분히 다양한 코드를 만든다', () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateCode()));
    expect(codes.size).toBe(1000);
  });

  it.each(['abc', 'A_b-9', '한글링크', '日本語', 'a'.repeat(100)])(
    '%s 는 사용할 수 있다',
    (code) => {
      expect(CODE_PATTERN.test(code)).toBe(true);
    },
  );

  it.each([
    '',
    'a b',
    'a/b',
    'a?b',
    'a#b',
    'a&b',
    'a"b',
    "a'b",
    'a.b',
    '<x>',
    'a'.repeat(101),
  ])('%j 는 사용할 수 없다', (code) => {
    expect(CODE_PATTERN.test(code)).toBe(false);
  });

  it('서비스 경로와 겹치는 주소는 대소문자와 관계없이 예약어이다', () => {
    for (const code of [
      'api',
      'API',
      'App',
      'assets',
      'auth',
      'register',
      'stat',
      'health',
    ]) {
      expect(isReservedCode(code)).toBe(true);
    }
    expect(isReservedCode('my-app')).toBe(false);
  });

  it('유니코드를 NFC 로 정규화한다', () => {
    const decomposed = '한글'.normalize('NFD');
    expect(decomposed).not.toBe('한글');
    expect(normalizeCode(decomposed)).toBe('한글');
  });

  it('http(s) 주소만 허용한다', () => {
    expect(isHttpUrl('https://example.com/a?b=1')).toBe(true);
    expect(isHttpUrl('http://localhost:3000')).toBe(true);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('data:text/html,<script>')).toBe(false);
    expect(isHttpUrl('ftp://example.com')).toBe(false);
    expect(isHttpUrl('not a url')).toBe(false);
  });
});
