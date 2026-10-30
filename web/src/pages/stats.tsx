import { ArrowLeft, QrCode, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { BarChart } from '@/components/bar-chart';
import { CopyButton } from '@/components/copy-button';
import { DeleteDialog } from '@/components/delete-dialog';
import { QrDialog } from '@/components/qr-dialog';
import { ErrorState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { useLinkStats } from '@/hooks/queries';
import { usePageTitle } from '@/hooks/use-page-title';
import { ApiError, type LinkView } from '@/lib/api';
import {
  formatDate,
  formatDateTime,
  relativeTime,
  safeHttpUrl,
  shortLabel,
  shortUrl,
} from '@/lib/format';

function BackLink() {
  return (
    <Link
      to="/app"
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden />
      내 링크
    </Link>
  );
}

export function StatsPage() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const stats = useLinkStats(code);

  const [qrLink, setQrLink] = useState<LinkView | null>(null);
  const [deleting, setDeleting] = useState<LinkView | null>(null);

  usePageTitle(`${code} 통계`);

  if (stats.isPending) {
    return (
      <div role="status" aria-label="통계를 불러오는 중" className="animate-pulse">
        <BackLink />
        <div className="mt-6 h-8 w-56 rounded bg-ink/10" />
        <div className="mt-12 h-20 w-40 rounded bg-ink/10" />
      </div>
    );
  }

  if (stats.isError) {
    const notFound = stats.error instanceof ApiError && stats.error.status === 404;
    return (
      <>
        <BackLink />
        <div className="mt-6">
          <ErrorState
            title={notFound ? '링크를 찾을 수 없습니다' : '통계를 불러오지 못했습니다'}
            message={
              notFound
                ? '삭제됐거나 내 계정으로 만든 링크가 아닙니다.'
                : stats.error.message
            }
            onRetry={notFound ? undefined : () => void stats.refetch()}
          />
        </div>
      </>
    );
  }

  const { link, total, last7, last30, daily, recent } = stats.data;
  const label = shortLabel(link.code);
  const original = safeHttpUrl(link.originalUrl);

  return (
    <>
      <BackLink />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="min-w-0 break-all font-mono text-2xl font-medium sm:text-3xl">
          {label}
        </h1>
        <div className="flex items-center gap-1">
          <CopyButton text={shortUrl(link.code)} variant="secondary" />
          <Button
            variant="ghost"
            size="icon"
            aria-label="QR 코드 보기"
            onClick={() => setQrLink(link)}
          >
            <QrCode className="size-[18px]" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="링크 삭제"
            className="hover:text-danger"
            onClick={() => setDeleting(link)}
          >
            <Trash2 className="size-[18px]" aria-hidden />
          </Button>
        </div>
      </div>

      <p className="mt-2 break-all text-muted">
        {original ? (
          <a
            href={original}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-line-strong decoration-1 underline-offset-4 hover:text-ink hover:decoration-ink"
          >
            {link.originalUrl}
          </a>
        ) : (
          link.originalUrl
        )}
      </p>

      <p className="tabular mt-12 text-7xl font-semibold tracking-tight sm:text-8xl">
        {total.toLocaleString('ko-KR')}
      </p>
      <p className="mt-1 max-w-md text-muted">
        지금까지 클릭된 횟수입니다. 최근 7일에는 {last7.toLocaleString('ko-KR')}회, 최근
        30일에는 {last30.toLocaleString('ko-KR')}회 클릭됐습니다.
      </p>

      <section className="mt-12" aria-labelledby="chart-heading">
        <h2 id="chart-heading" className="mb-4 text-lg">
          최근 30일
        </h2>
        <BarChart data={daily} />
      </section>

      <section className="mt-12" aria-labelledby="info-heading">
        <h2 id="info-heading" className="mb-4 text-lg">
          링크 정보
        </h2>
        <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-y-3 border-t border-line pt-4 text-sm">
          <dt className="text-muted">만든 날짜</dt>
          <dd>{link.createdAt ? formatDate(link.createdAt) : '기록 없음'}</dd>
          <dt className="text-muted">만료</dt>
          <dd>
            {link.expiresAt
              ? `${formatDateTime(link.expiresAt)}${link.expired ? ' (만료됨)' : ''}`
              : '없음'}
          </dd>
          <dt className="text-muted">비밀번호</dt>
          <dd>{link.hasPassword ? '설정됨' : '없음'}</dd>
        </dl>
      </section>

      <section className="mt-12" aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-4 text-lg">
          최근 클릭
        </h2>
        {recent.length === 0 ? (
          <p className="border-t border-line pt-4 text-muted">아직 클릭 기록이 없습니다.</p>
        ) : (
          <ul className="border-t border-line">
            {recent.map((iso) => (
              <li
                key={iso}
                className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-sm"
              >
                <span>{relativeTime(iso)}</span>
                <time dateTime={iso} className="tabular text-muted">
                  {formatDateTime(iso)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <QrDialog link={qrLink} onClose={() => setQrLink(null)} />
      <DeleteDialog
        link={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() => navigate('/app', { replace: true })}
      />
    </>
  );
}
