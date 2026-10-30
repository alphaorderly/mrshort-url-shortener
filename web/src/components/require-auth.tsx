import { Navigate, useLocation } from 'react-router';
import { AppShell } from '@/components/app-shell';
import { PublicLayout } from '@/components/public-layout';
import { ErrorState } from '@/components/states';
import { useMe } from '@/hooks/queries';

/** 로그인하지 않았으면 로그인 화면으로 보내고, 로그인 뒤 원래 가려던 곳으로 돌아오게 한다. */
export function RequireAuth() {
  const { data: me, isPending, isError, error, refetch } = useMe();
  const location = useLocation();

  if (isPending) {
    return <div className="min-h-screen" role="status" aria-label="불러오는 중" />;
  }

  if (isError) {
    return (
      <PublicLayout>
        <ErrorState
          title="서버에 연결하지 못했습니다"
          message={error.message}
          onRetry={() => void refetch()}
        />
      </PublicLayout>
    );
  }

  if (!me) {
    return (
      <Navigate
        to="/app/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <AppShell />;
}
