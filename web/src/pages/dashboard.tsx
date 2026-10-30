import { useState } from 'react';
import { Composer } from '@/components/composer';
import { CopyButton } from '@/components/copy-button';
import { DeleteDialog } from '@/components/delete-dialog';
import { LinkRow } from '@/components/link-row';
import { QrDialog } from '@/components/qr-dialog';
import { ErrorState, LinkListSkeleton } from '@/components/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLinks } from '@/hooks/queries';
import { usePageTitle } from '@/hooks/use-page-title';
import type { LinkView } from '@/lib/api';
import { displayUrl, shortLabel, shortUrl } from '@/lib/format';

export function DashboardPage() {
  usePageTitle('내 링크');

  const [fresh, setFresh] = useState<LinkView | null>(null);
  const [qrLink, setQrLink] = useState<LinkView | null>(null);
  const [deleting, setDeleting] = useState<LinkView | null>(null);

  return (
    <>
      <h1 className="sr-only">내 링크</h1>
      <Composer onCreated={setFresh} />

      <div role="status">
        {fresh && (
          <section className="mt-8 border-t border-line pt-6">
            <p className="text-sm text-muted">짧은 주소가 만들어졌습니다.</p>
            <p className="mt-2 break-all font-mono text-2xl font-medium sm:text-3xl">
              {/* key 가 바뀌면 형광펜이 처음부터 다시 그어진다. */}
              <span key={fresh.id} className="marker marker-sweep">
                {shortLabel(fresh.code)}
              </span>
            </p>
            <p className="mt-2 truncate text-sm text-muted" title={fresh.originalUrl}>
              {displayUrl(fresh.originalUrl)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <CopyButton
                text={shortUrl(fresh.code)}
                label="주소 복사"
                variant="primary"
                size="md"
              />
              <Button variant="secondary" onClick={() => setQrLink(fresh)}>
                QR 코드
              </Button>
            </div>
          </section>
        )}
      </div>

      <LinkList onShowQr={setQrLink} onDelete={setDeleting} />

      <QrDialog link={qrLink} onClose={() => setQrLink(null)} />
      <DeleteDialog
        link={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={() =>
          setFresh((current) => (current?.id === deleting?.id ? null : current))
        }
      />
    </>
  );
}

function LinkList({
  onShowQr,
  onDelete,
}: {
  onShowQr: (link: LinkView) => void;
  onDelete: (link: LinkView) => void;
}) {
  const links = useLinks();
  const [query, setQuery] = useState('');

  const all = links.data ?? [];
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? all.filter(
        (link) =>
          link.code.toLowerCase().includes(needle) ||
          link.originalUrl.toLowerCase().includes(needle),
      )
    : all;

  return (
    <section className="mt-14" aria-labelledby="links-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 id="links-heading" className="text-xl">
          내 링크{' '}
          {links.isSuccess && (
            <span className="tabular font-normal text-muted">{all.length}</span>
          )}
        </h2>
        {all.length > 0 && (
          <Input
            type="search"
            aria-label="링크 검색"
            placeholder="주소로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-10 w-56 max-w-full"
          />
        )}
      </div>

      {links.isPending && <LinkListSkeleton />}

      {links.isError && (
        <ErrorState
          title="링크를 불러오지 못했습니다"
          message={links.error.message}
          onRetry={() => void links.refetch()}
        />
      )}

      {links.isSuccess && all.length === 0 && (
        <div className="border-t border-line py-14">
          <p className="font-semibold">아직 만든 링크가 없습니다</p>
          <p className="mt-1 text-muted">
            위 입력란에 긴 주소를 붙여 넣고 줄이기를 누르면 첫 링크가 만들어집니다.
          </p>
        </div>
      )}

      {links.isSuccess && all.length > 0 && visible.length === 0 && (
        <div className="border-t border-line py-10">
          <p className="text-muted">“{query.trim()}” 와 일치하는 링크가 없습니다.</p>
        </div>
      )}

      {visible.length > 0 && (
        <ul className="border-t border-line">
          {visible.map((link) => (
            <LinkRow
              key={link.id}
              link={link}
              onShowQr={onShowQr}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
