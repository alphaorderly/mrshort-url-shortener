import { CODE_PATTERN, generateCode, normalizeCode } from './code.util';

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

  it.each(['api', 'app', 'assets', 'login'])(
    '%j 같은 서비스 이름도 짧은 주소로 쓸 수 있다',
    (code) => {
      expect(CODE_PATTERN.test(code)).toBe(true);
    },
  );

  it('앱 경로의 접두사(~)는 짧은 주소로 쓸 수 없다', () => {
    expect(CODE_PATTERN.test('~')).toBe(false);
  });

  it('유니코드를 NFC 로 정규화한다', () => {
    const decomposed = '한글'.normalize('NFD');
    expect(decomposed).not.toBe('한글');
    expect(normalizeCode(decomposed)).toBe('한글');
  });
});
