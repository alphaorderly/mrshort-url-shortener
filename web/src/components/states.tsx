import { Button } from '@/components/ui/button';

export function LinkListSkeleton() {
  return (
    <div role="status" aria-label="링크를 불러오는 중" className="border-t border-line">
      {[0, 1, 2].map((index) => (
        <div key={index} className="animate-pulse border-b border-line py-5">
          <div className="h-4 w-48 rounded bg-ink/10" />
          <div className="mt-3 h-3.5 w-72 max-w-full rounded bg-ink/10" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  title = '불러오지 못했습니다',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="border-t border-line py-8">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}
