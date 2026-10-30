/** 복사하거나 QR 로 만들 때 쓰는 완전한 짧은 주소 */
export function shortUrl(code: string, origin: string = window.location.origin): string {
  return `${origin}/${encodeURIComponent(code)}`;
}

/** 화면에 보여 줄 짧은 주소. 프로토콜을 떼고 한글 주소는 읽을 수 있게 그대로 둔다. */
export function shortLabel(code: string, origin: string = window.location.origin): string {
  return `${origin}/${code}`.replace(/^https?:\/\//, '');
}

/**
 * 링크의 href 로 써도 안전한 주소만 돌려준다.
 * 예전 데이터에 javascript: 같은 스킴이 들어 있어도 클릭 가능한 링크로 만들지 않기 위해서다.
 */
export function safeHttpUrl(value: string): string | undefined {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:' ? value : undefined;
  } catch {
    return undefined;
  }
}

/** 프로토콜과 끝의 `/` 를 뗀 원본 주소 */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

const sameYear = (date: Date, now: Date) => date.getFullYear() === now.getFullYear();

export function formatDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('ko-KR', {
    year: sameYear(date, now) ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('ko-KR', {
    year: sameYear(date, now) ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** "방금 전", "5분 전", "3시간 전", "2일 전", 일주일이 넘으면 날짜 */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((now - new Date(iso).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat('ko-KR', { numeric: 'always' });

  if (seconds < 60) return '방금 전';
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), 'minute');
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), 'hour');
  if (seconds < 7 * 86400) return rtf.format(-Math.floor(seconds / 86400), 'day');
  return formatDate(iso, new Date(now));
}

/** `<input type="datetime-local">` 이 받는 `YYYY-MM-DDTHH:mm` 형식 (로컬 시간) */
export function toLocalInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** "10월 29일" 처럼 `YYYY-MM-DD` 문자열을 월/일로만 보여 준다. */
export function formatDayKey(key: string): string {
  const [, month, day] = key.split('-').map(Number);
  return `${month}월 ${day}일`;
}
