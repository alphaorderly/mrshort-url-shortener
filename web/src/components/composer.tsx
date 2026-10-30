import { Clock, Lock, Pencil } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { useConfig, useCreateLink } from '@/hooks/queries';
import { ApiError, type LinkView } from '@/lib/api';
import { cn } from '@/lib/cn';
import { addDays, shortLabel, toLocalInputValue } from '@/lib/format';

type Option = 'expiry' | 'password' | 'code';

/** 프로토콜 없이 붙여 넣은 주소(example.com/a)는 https:// 를 붙여 준다. */
export function normalizeUrlInput(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
}

const OPTIONS: { key: Option; label: string; icon: typeof Clock }[] = [
  { key: 'expiry', label: '만료일', icon: Clock },
  { key: 'password', label: '비밀번호', icon: Lock },
  { key: 'code', label: '주소 직접 정하기', icon: Pencil },
];

const PRESET_DAYS = [1, 7, 30];

export function Composer({ onCreated }: { onCreated: (link: LinkView) => void }) {
  const { data: config } = useConfig();
  const create = useCreateLink();

  const [url, setUrl] = useState('');
  const [open, setOpen] = useState<Record<Option, boolean>>({
    expiry: false,
    password: false,
    code: false,
  });
  const [expiresAt, setExpiresAt] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  function toggle(option: Option) {
    const next = !open[option];
    if (next && option === 'expiry' && !expiresAt) {
      setExpiresAt(toLocalInputValue(addDays(new Date(), 7)));
    }
    setOpen({ ...open, [option]: next });
  }

  function validate(target: string): Record<string, string> {
    const found: Record<string, string> = {};
    if (!target) found.url = '줄일 주소를 입력하세요.';
    if (open.expiry) {
      if (!expiresAt) found.expiresAt = '만료 시각을 선택하세요.';
      else if (new Date(expiresAt).getTime() <= Date.now())
        found.expiresAt = '만료 시각은 지금보다 이후여야 합니다.';
    }
    if (open.password && !password) found.password = '링크 비밀번호를 입력하세요.';
    if (open.code && !code.trim()) found.code = '사용할 주소를 입력하세요.';
    return found;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError('');

    const target = normalizeUrlInput(url);
    const found = validate(target);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      const link = await create.mutateAsync({
        url: target,
        expiresAt: open.expiry ? new Date(expiresAt).toISOString() : undefined,
        password: open.password ? password : undefined,
        code: open.code ? code.trim() : undefined,
      });
      setUrl('');
      setPassword('');
      setCode('');
      setExpiresAt('');
      setOpen({ expiry: false, password: false, code: false });
      onCreated(link);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      const fromServer = Object.fromEntries(
        Object.entries(error.fields).map(([field, messages]) => [field, messages[0]]),
      );
      setErrors(fromServer);
      if (Object.keys(fromServer).length === 0) setFormError(error.message);
    }
  }

  const prefix = shortLabel(config?.baseUrl ?? null, '');

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="짧은 주소 만들기">
      <label htmlFor="composer-url" className="sr-only">
        줄일 주소
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="composer-url"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="줄이고 싶은 긴 주소를 붙여 넣으세요"
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={errors.url ? 'composer-url-error' : undefined}
          className="h-14 w-full min-w-0 rounded-panel sm:flex-1 border border-line-strong bg-surface px-4 text-lg text-ink placeholder:text-muted aria-[invalid=true]:border-danger"
        />
        <Button type="submit" size="lg" disabled={create.isPending}>
          {create.isPending ? '줄이는 중…' : '줄이기'}
        </Button>
      </div>
      {errors.url && (
        <p id="composer-url-error" role="alert" className="mt-2 text-sm text-danger">
          {errors.url}
        </p>
      )}

      <div role="group" aria-label="추가 옵션" className="mt-3 flex flex-wrap gap-2">
        {OPTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={open[key]}
            onClick={() => toggle(key)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-field border px-3 text-sm transition-colors',
              open[key]
                ? 'border-ink bg-ink/5 text-ink'
                : 'border-line-strong text-muted hover:text-ink',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {(open.expiry || open.password || open.code) && (
        <div className="mt-5 grid gap-5">
          {open.expiry && (
            <Field
              label="만료일"
              hint="이 시각이 지나면 링크가 열리지 않습니다."
              error={errors.expiresAt}
            >
              {(control) => (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    {...control}
                    type="datetime-local"
                    value={expiresAt}
                    min={toLocalInputValue(new Date())}
                    onChange={(event) => setExpiresAt(event.target.value)}
                    className="w-auto min-w-0 flex-1 sm:flex-none"
                  />
                  {PRESET_DAYS.map((days) => (
                    <Button
                      key={days}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpiresAt(toLocalInputValue(addDays(new Date(), days)))
                      }
                    >
                      {days}일 후
                    </Button>
                  ))}
                </div>
              )}
            </Field>
          )}

          {open.password && (
            <Field
              label="링크 비밀번호"
              hint="방문자가 이 비밀번호를 입력해야 원래 주소로 이동합니다."
              error={errors.password}
            >
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
          )}

          {open.code && (
            <Field
              label="짧은 주소"
              hint="글자, 숫자, - _ 를 쓸 수 있습니다. 한글도 됩니다."
              error={errors.code}
            >
              {(control) => (
                <div className="flex">
                  <span className="flex shrink-0 items-center whitespace-nowrap rounded-l-field border border-r-0 border-line-strong bg-ink/5 px-3 font-mono text-sm text-muted">
                    {prefix}
                  </span>
                  <Input
                    {...control}
                    value={code}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) => setCode(event.target.value)}
                    className="rounded-l-none font-mono"
                  />
                </div>
              )}
            </Field>
          )}
        </div>
      )}

      {formError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {formError}
        </p>
      )}
    </form>
  );
}
