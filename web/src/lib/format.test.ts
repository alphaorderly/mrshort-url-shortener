import { normalizeUrlInput } from '@/components/composer';
import {
  addDays,
  displayUrl,
  formatDayKey,
  relativeTime,
  shortLabel,
  shortUrl,
  toLocalInputValue,
} from './format';

describe('format', () => {
  describe('shortUrl / shortLabel', () => {
    it('복사용 주소는 코드를 인코딩하고, 화면용 주소는 읽을 수 있게 둔다', () => {
      expect(shortUrl('팀핸드북', 'https://s.example.com')).toBe(
        'https://s.example.com/%ED%8C%80%ED%95%B8%EB%93%9C%EB%B6%81',
      );
      expect(shortLabel('팀핸드북', 'https://s.example.com')).toBe('s.example.com/팀핸드북');
    });

    it('origin 을 주지 않으면 현재 접속 주소를 쓴다', () => {
      expect(shortUrl('abc')).toBe(`${window.location.origin}/abc`);
      expect(shortLabel('abc')).toBe(`${window.location.host}/abc`);
    });
  });

  it('displayUrl 은 프로토콜과 끝의 / 를 뗀다', () => {
    expect(displayUrl('https://example.com/')).toBe('example.com');
    expect(displayUrl('http://example.com/a/b?c=1')).toBe('example.com/a/b?c=1');
  });

  describe('relativeTime', () => {
    const now = new Date('2026-10-30T12:00:00Z').getTime();
    const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();

    it('단위별로 읽기 좋게 보여 준다', () => {
      expect(relativeTime(ago(10), now)).toBe('방금 전');
      expect(relativeTime(ago(5 * 60), now)).toBe('5분 전');
      expect(relativeTime(ago(3 * 3600), now)).toBe('3시간 전');
      expect(relativeTime(ago(2 * 86400), now)).toBe('2일 전');
    });

    it('일주일이 넘으면 날짜를 보여 준다', () => {
      expect(relativeTime(ago(20 * 86400), now)).toMatch(/10월 10일/);
    });
  });

  it('toLocalInputValue 는 datetime-local 형식(로컬 시간)을 만든다', () => {
    expect(toLocalInputValue(new Date(2026, 0, 5, 9, 7))).toBe('2026-01-05T09:07');
  });

  it('addDays 는 원본을 바꾸지 않는다', () => {
    const start = new Date(2026, 0, 30);
    expect(addDays(start, 3).getDate()).toBe(2);
    expect(start.getDate()).toBe(30);
  });

  it('formatDayKey 는 월/일만 보여 준다', () => {
    expect(formatDayKey('2026-10-09')).toBe('10월 9일');
  });
});

describe('normalizeUrlInput', () => {
  it.each([
    ['example.com/a', 'https://example.com/a'],
    ['  example.com  ', 'https://example.com'],
    ['http://example.com', 'http://example.com'],
    ['HTTPS://Example.com', 'HTTPS://Example.com'],
    ['', ''],
    ['   ', ''],
  ])('%j → %j', (input, expected) => {
    expect(normalizeUrlInput(input)).toBe(expected);
  });
});
