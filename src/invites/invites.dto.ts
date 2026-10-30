import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{16,64}$/, {
    message: '초대 링크가 올바르지 않습니다.',
  })
  token!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9._@-]{3,50}$/, {
    message: '아이디는 영문, 숫자, . _ @ - 만 사용해 3~50자로 입력하세요.',
  })
  username!: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(128, { message: '비밀번호는 128자 이하여야 합니다.' })
  password!: string;
}
