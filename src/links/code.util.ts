import { randomInt } from 'crypto';

const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * 글자, 숫자, `_`, `-` 만 허용한다. 한글 같은 유니코드 글자도 쓸 수 있다.
 * 앱(`/~`)과 API(`/api/...`)는 이 패턴과 겹칠 수 없는 경로에 있어서 예약어가 필요 없다.
 */
export const CODE_PATTERN = /^[\p{L}\p{N}_-]{1,100}$/u;

export function generateCode(length = 7): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

export function normalizeCode(code: string): string {
  return code.normalize('NFC');
}
