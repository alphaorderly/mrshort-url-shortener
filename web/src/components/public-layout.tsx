import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Wordmark } from '@/components/wordmark';
import { useConfig } from '@/hooks/queries';

/** 로그인 전에 보이는 화면들(로그인, 가입, 비밀번호 입력, 찾을 수 없음)의 공통 틀 */
export function PublicLayout({ children }: { children: ReactNode }) {
  const { data } = useConfig();

  return (
    <>
      <header className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
        <Link to="/~">
          <Wordmark name={data?.serviceName ?? 'MrShort'} />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-[10vh] sm:px-6">
        <div className="max-w-sm">{children}</div>
      </main>
    </>
  );
}
