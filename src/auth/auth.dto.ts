import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '아이디를 입력하세요.' })
  @MaxLength(100)
  username!: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호를 입력하세요.' })
  @MaxLength(256)
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '현재 비밀번호를 입력하세요.' })
  @MaxLength(256)
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: '새 비밀번호는 8자 이상이어야 합니다.' })
  @MaxLength(128, { message: '새 비밀번호는 128자 이하여야 합니다.' })
  newPassword!: string;
}
