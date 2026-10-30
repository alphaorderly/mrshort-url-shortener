import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/copy-button';
import { buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import type { LinkView } from '@/lib/api';
import { shortLabel, shortUrl } from '@/lib/format';

export function QrDialog({
  link,
  onClose,
}: {
  link: LinkView | null;
  onClose: () => void;
}) {
  const url = link ? shortUrl(link.code) : '';
  const [image, setImage] = useState('');

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    QRCode.toDataURL(url, { width: 560, margin: 2, errorCorrectionLevel: 'M' })
      .then((dataUrl) => {
        if (!cancelled) setImage(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setImage('');
      });
    return () => {
      cancelled = true;
      setImage('');
    };
  }, [url]);

  return (
    <Dialog open={link !== null} onOpenChange={(open) => !open && onClose()}>
      {link && (
        <DialogContent title="QR 코드" description={shortLabel(link.code)}>
          <div className="grid place-items-center rounded-field bg-white p-2">
            {image ? (
              <img
                src={image}
                alt={`${shortLabel(link.code)} 주소로 연결되는 QR 코드`}
                width={280}
                height={280}
                className="size-[280px] max-w-full"
              />
            ) : (
              <div className="size-[280px] max-w-full" role="status" aria-label="QR 코드를 만드는 중" />
            )}
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <CopyButton text={url} label="주소 복사" variant="secondary" size="md" />
            {image && (
              <a
                href={image}
                download={`qr-${link.code}.png`}
                className={buttonVariants({ variant: 'primary', size: 'md' })}
              >
                이미지 저장
              </a>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
