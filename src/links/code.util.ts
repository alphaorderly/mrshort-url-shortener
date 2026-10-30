import { randomInt } from 'crypto';

const ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** 글자, 숫자, `_`, `-` 만 허용한다. 한글 같은 유니코드 글자도 쓸 수 있다. */
export const CODE_PATTERN = /^[\p{L}\p{N}_-]{1,100}$/u;

/** 서비스 경로와 겹치는 주소는 짧은 주소로 쓸 수 없다. */
const RESERVED_CODES = new Set(['api', 'app', 'assets']);

export function generateCode(length = 7): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

export function isReservedCode(code: string): boolean {
  return RESERVED_CODES.has(code.toLowerCase());
}

export function normalizeCode(code: string): string {
  return code.normalize('NFC');
}
