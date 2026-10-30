import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-md border px-2 text-[13px] leading-none',
        tone === 'danger'
          ? 'border-danger/50 text-danger'
          : 'border-line-strong text-muted',
      )}
    >
      {children}
    </span>
  );
}
