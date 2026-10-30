import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
} from '@/components/ui/dialog';
import { useDeleteLink } from '@/hooks/queries';
import { ApiError, type LinkView } from '@/lib/api';
import { shortLabel } from '@/lib/format';

export function DeleteDialog({
  link,
  baseUrl,
  onClose,
  onDeleted,
}: {
  link: LinkView | null;
  baseUrl: string | null;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const remove = useDeleteLink();

  async function confirm() {
    if (!link) return;
    try {
      await remove.mutateAsync(link.code);
      toast.success('링크를 삭제했습니다.');
      onClose();
      onDeleted?.();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : '삭제하지 못했습니다.');
    }
  }

  return (
    <AlertDialog open={link !== null} onOpenChange={(open) => !open && onClose()}>
      {link && (
        <AlertDialogContent
          title="링크를 삭제할까요?"
          description={
            <>
              <span className="break-all font-mono text-ink">
                {shortLabel(baseUrl, link.code)}
              </span>{' '}
              주소로 접속해도 더 이상 열리지 않고, 클릭 기록도 함께 삭제됩니다.
              되돌릴 수 없습니다.
            </>
          }
        >
          <AlertDialogCancel asChild>
            <Button variant="secondary">취소</Button>
          </AlertDialogCancel>
          <Button variant="danger" onClick={confirm} disabled={remove.isPending}>
            {remove.isPending ? '삭제하는 중…' : '삭제'}
          </Button>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
