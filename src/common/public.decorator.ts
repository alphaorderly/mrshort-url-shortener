import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** 로그인 없이 접근할 수 있는 라우트. 전역 SessionGuard 가 기본적으로 모든 라우트를 막는다. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
