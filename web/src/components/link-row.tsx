import { BarChart3, Clock, Lock, QrCode, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { CopyButton } from '@/components/copy-button';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import type { LinkView } from '@/lib/api';
import { displayUrl, formatDate, shortLabel, shortUrl } from '@/lib/format';

export function LinkRow({
  link,
  onShowQr,
  onDelete,
}: {
  link: LinkView;
  onShowQr: (link: LinkView) => void;
  onDelete: (link: LinkView) => void;
}) {
  const label = shortLabel(link.code);

  return (
    <li className="grid gap-x-6 gap-y-3 border-b border-line py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate font-mono text-[15px] font-medium">{label}</p>
        <p className="truncate text-sm text-muted" title={link.originalUrl}>
          {displayUrl(link.originalUrl)}
        </p>
        {(link.hasPassword || link.expiresAt) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {link.hasPassword && (
              <Badge>
                <Lock className="size-3.5" aria-hidden />
                비밀번호
              </Badge>
            )}
            {link.expired ? (
              <Badge tone="danger">
                <Clock className="size-3.5" aria-hidden />
                만료됨
              </Badge>
            ) : (
              link.expiresAt && (
                <Badge>
                  <Clock className="size-3.5" aria-hidden />
                  {formatDate(link.expiresAt)} 만료
                </Badge>
              )
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 sm:justify-end">
        <span className="tabular mr-2 text-sm text-muted">
          클릭 <strong className="font-semibold text-ink">{link.clickCount.toLocaleString('ko-KR')}</strong>
        </span>
        <CopyButton text={shortUrl(link.code)} />
        <Link
          to={`/app/stats/${encodeURIComponent(link.code)}`}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <BarChart3 className="size-4" aria-hidden />
          통계
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${label} QR 코드 보기`}
          onClick={() => onShowQr(link)}
        >
          <QrCode className="size-[18px]" aria-hidden />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${label} 삭제`}
          className="hover:text-danger"
          onClick={() => onDelete(link)}
        >
          <Trash2 className="size-[18px]" aria-hidden />
        </Button>
      </div>
    </li>
  );
}
