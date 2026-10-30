import { useState, type FormEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { CopyButton } from '@/components/copy-button';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import {
  useChangePassword,
  useConfig,
  useCreateInvite,
  useMe,
} from '@/hooks/queries';
import { usePageTitle } from '@/hooks/use-page-title';
import { ApiError } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

export function AccountPage() {
  usePageTitle('계정');
  const { data: me } = useMe();

  return (
    <>
      <h1 className="text-3xl font-semibold sm:text-4xl">계정</h1>
      {me && (
        <p className="mt-2 text-muted">
          <strong className="font-semibold text-ink">{me.username}</strong> 계정으로 로그인했습니다.
        </p>
      )}

      <Section
        title="비밀번호 변경"
        description="변경하면 다른 기기에서는 로그아웃됩니다. 이 기기는 로그인된 상태로 유지됩니다."
      >
        <PasswordForm />
      </Section>

      <Section
        title="팀원 초대"
        description="초대 링크로 가입한 사람은 바로 링크를 만들 수 있습니다. 링크는 한 번만 쓸 수 있습니다."
      >
        <InviteForm />
      </Section>
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-12 grid gap-6 border-t border-line pt-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
      <div>
        <h2 className="text-lg">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="max-w-md">{children}</div>
    </section>
  );
}

function PasswordForm() {
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const found: Record<string, string> = {};
    if (!current) found.currentPassword = '현재 비밀번호를 입력하세요.';
    if (next.length < 8) found.newPassword = '새 비밀번호는 8자 이상이어야 합니다.';
    else if (next === current) found.newPassword = '현재 비밀번호와 다른 비밀번호를 입력하세요.';
    if (confirm !== next) found.confirm = '새 비밀번호가 일치하지 않습니다.';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await change.mutateAsync({ currentPassword: current, newPassword: next });
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success('비밀번호를 변경했습니다.');
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      const fromServer = Object.fromEntries(
        Object.entries(error.fields).map(([field, messages]) => [field, messages[0]]),
      );
      setErrors(
        Object.keys(fromServer).length > 0
          ? fromServer
          : { [error.status === 400 ? 'currentPassword' : 'confirm']: error.message },
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <Field label="현재 비밀번호" error={errors.currentPassword}>
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        )}
      </Field>
      <Field label="새 비밀번호" hint="8자 이상" error={errors.newPassword}>
        {(control) => (
          <Input
            {...control}
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
        )}
      </Field>
      <Field label="새 비밀번호 확인" error={errors.confirm}>
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
      <div>
        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? '변경하는 중…' : '비밀번호 변경'}
        </Button>
      </div>
    </form>
  );
}

function InviteForm() {
  const { data: config } = useConfig();
  const invite = useCreateInvite();

  const base = config?.baseUrl ?? `${window.location.origin}/`;
  const link = invite.data ? `${base}app/register/${invite.data.token}` : '';

  return (
    <div className="grid gap-4">
      <div>
        <Button
          variant={invite.data ? 'secondary' : 'primary'}
          onClick={() => invite.mutate()}
          disabled={invite.isPending}
        >
          {invite.isPending
            ? '만드는 중…'
            : invite.data
              ? '새 초대 링크 만들기'
              : '초대 링크 만들기'}
        </Button>
      </div>

      {invite.isError && (
        <p role="alert" className="text-sm text-danger">
          {invite.error.message}
        </p>
      )}

      {invite.data && (
        <div role="status" className="grid gap-3">
          <Field
            label="초대 링크"
            hint={`${formatDateTime(invite.data.expiresAt)}까지, 한 번만 사용할 수 있습니다.`}
          >
            {(control) => (
              <div className="flex gap-2">
                <Input
                  {...control}
                  readOnly
                  value={link}
                  onFocus={(event) => event.currentTarget.select()}
                  className="min-w-0 font-mono text-sm"
                />
                <CopyButton text={link} variant="secondary" size="md" />
              </div>
            )}
          </Field>
        </div>
      )}
    </div>
  );
}
