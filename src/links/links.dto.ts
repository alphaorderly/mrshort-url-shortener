import { Transform } from 'class-transformer';
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { CODE_PATTERN } from './code.util';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** 빈 문자열은 "값 없음" 으로 취급한다. */
const emptyToUndefined = ({ value }: { value: unknown }) => {
  const trimmed = trim({ value });
  return trimmed === '' ? undefined : trimmed;
};

export class CreateLinkDto {
  @Transform(trim)
  @IsString()
  @MaxLength(2048, { message: '주소는 2048자 이하여야 합니다.' })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_tld: false,
    },
    { message: 'http:// 또는 https:// 로 시작하는 올바른 주소를 입력하세요.' },
  )
  url!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsISO8601(
    { strict: true },
    { message: '만료 시각 형식이 올바르지 않습니다.' },
  )
  expiresAt?: string | null;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(128, { message: '링크 비밀번호는 128자 이하여야 합니다.' })
  password?: string | null;

  @IsOptional()
  @Transform(emptyToUndefined)
  @Matches(CODE_PATTERN, {
    message: '주소는 글자, 숫자, _ - 만 사용해 100자 이하로 입력하세요.',
  })
  code?: string | null;
}

export class UnlockLinkDto {
  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력하세요.' })
  @MaxLength(128)
  password!: string;
}
