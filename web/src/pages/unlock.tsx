import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { PublicLayout } from '@/components/public-layout';
import { Button, buttonVariants } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { usePageTitle } from '@/hooks/use-page-title';
import { api, ApiError } from '@/lib/api';

export function UnlockPage() {
  usePageTitle('비밀번호 입력');
  const { code = '' } = useParams();
  const [password, setPassword] = useState('');

  const unlock = useMutation({
    mutationFn: (value: string) => api.unlock(code, value),
    onSuccess: ({ url }) => window.location.assign(url),
  });

  const gone = unlock.error instanceof ApiError && unlock.error.status === 404;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!password) return;
    unlock.mutate(password);
  }

  if (gone) {
    return (
      <PublicLayout>
        <h1 className="text-3xl font-semibold">링크를 찾을 수 없습니다</h1>
        <p className="mt-2 text-muted">
          삭제됐거나 만료된 링크입니다. 링크를 보낸 사람에게 새 주소를 요청하세요.
        </p>
      </PublicLayout>
    );
  }

  const moving = unlock.isPending || unlock.isSuccess;

  return (
    <PublicLayout>
      <h1 className="text-3xl font-semibold">비밀번호가 필요한 링크입니다</h1>
      <p className="mt-2 text-muted">링크를 보낸 사람에게 받은 비밀번호를 입력하세요.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-5">
        <Field
          label="비밀번호"
          error={unlock.isError ? unlock.error.message : undefined}
        >
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="off"
              autoFocus
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
        <Button type="submit" disabled={moving || !password} className="w-full">
          {moving ? '이동하는 중…' : '열기'}
        </Button>
      </form>

      <Link to="/app" className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' mt-6 -ml-3'}>
        홈으로
      </Link>
    </PublicLayout>
  );
}
