import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router';
import { PublicLayout } from '@/components/public-layout';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { useLogin, useMe } from '@/hooks/queries';
import { usePageTitle } from '@/hooks/use-page-title';

export function LoginPage() {
  usePageTitle('로그인');
  const { data: me } = useMe();
  const login = useLogin();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const requested = (location.state as { from?: string } | null)?.from;
  const destination = requested?.startsWith('/app') ? requested : '/app';

  if (me) return <Navigate to={destination} replace />;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 입력하세요.');
      return;
    }
    login.mutate(
      { username: username.trim(), password },
      { onError: (failure) => setError(failure.message) },
    );
  }

  return (
    <PublicLayout>
      <h1 className="text-4xl font-semibold">로그인</h1>
      <p className="mt-2 text-muted">링크를 만들고 관리하려면 로그인하세요.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-5">
        <Field label="아이디">
          {(control) => (
            <Input
              {...control}
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          )}
        </Field>
        <Field label="비밀번호">
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={login.isPending} className="w-full">
          {login.isPending ? '로그인하는 중…' : '로그인'}
        </Button>
      </form>

      <p className="mt-8 text-sm text-muted">
        계정이 없으면 이미 사용 중인 팀원에게 초대 링크를 요청하세요.
      </p>
    </PublicLayout>
  );
}
