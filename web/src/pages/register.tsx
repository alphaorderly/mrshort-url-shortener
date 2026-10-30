import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { PublicLayout } from '@/components/public-layout';
import { buttonVariants, Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { useMe, useRegister } from '@/hooks/queries';
import { usePageTitle } from '@/hooks/use-page-title';
import { api, ApiError } from '@/lib/api';

export function RegisterPage() {
  usePageTitle('계정 만들기');
  const { token = '' } = useParams();
  const { data: me } = useMe();
  const invite = useQuery({
    queryKey: ['invite', token],
    queryFn: () => api.checkInvite(token),
    retry: false,
  });
  const register = useRegister();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (me) return <Navigate to="/~" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const found: Record<string, string> = {};
    if (!/^[A-Za-z0-9._@-]{3,50}$/.test(username)) {
      found.username = '아이디는 영문, 숫자, . _ @ - 만 사용해 3~50자로 입력하세요.';
    }
    if (password.length < 8) found.password = '비밀번호는 8자 이상이어야 합니다.';
    if (confirm !== password) found.confirm = '비밀번호가 일치하지 않습니다.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await register.mutateAsync({ token, username, password });
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      const fromServer = Object.fromEntries(
        Object.entries(error.fields).map(([field, messages]) => [field, messages[0]]),
      );
      setErrors(
        Object.keys(fromServer).length > 0
          ? fromServer
          : { [error.status === 409 ? 'username' : 'form']: error.message },
      );
    }
  }

  if (invite.isPending) {
    return (
      <PublicLayout>
        <p role="status" className="text-muted">
          초대 링크를 확인하고 있습니다.
        </p>
      </PublicLayout>
    );
  }

  if (invite.isError) {
    return (
      <PublicLayout>
        <h1 className="text-3xl font-semibold">확인하지 못했습니다</h1>
        <p className="mt-2 text-muted">{invite.error.message}</p>
        <Button className="mt-6" variant="secondary" onClick={() => void invite.refetch()}>
          다시 시도
        </Button>
      </PublicLayout>
    );
  }

  if (!invite.data) {
    return (
      <PublicLayout>
        <h1 className="text-3xl font-semibold">초대 링크를 쓸 수 없습니다</h1>
        <p className="mt-2 text-muted">
          링크가 만료됐거나 이미 사용됐습니다. 초대한 사람에게 새 링크를 요청하세요.
        </p>
        <Link to="/~/login" className={buttonVariants({ variant: 'secondary' }) + ' mt-6'}>
          로그인으로 이동
        </Link>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <h1 className="text-4xl font-semibold">계정 만들기</h1>
      <p className="mt-2 text-muted">사용할 아이디와 비밀번호를 정하세요.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-5">
        <Field label="아이디" error={errors.username}>
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
        <Field label="비밀번호" hint="8자 이상" error={errors.password}>
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
        <Field label="비밀번호 확인" error={errors.confirm}>
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          )}
        </Field>

        {errors.form && (
          <p role="alert" className="text-sm text-danger">
            {errors.form}
          </p>
        )}

        <Button type="submit" disabled={register.isPending} className="w-full">
          {register.isPending ? '만드는 중…' : '계정 만들기'}
        </Button>
      </form>
    </PublicLayout>
  );
}
