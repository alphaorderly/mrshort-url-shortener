import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const overlayClass =
  'fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/55 p-4 animate-[overlay-in_160ms_ease-out]';
const panelClass =
  'relative w-full max-w-md rounded-panel border border-line bg-surface p-6 text-ink animate-[dialog-in_180ms_ease-out]';

export const Dialog = DialogPrimitive.Root;

export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass}>
        <DialogPrimitive.Content
          className={cn(panelClass, className)}
          aria-describedby={description ? undefined : undefined}
        >
          <DialogPrimitive.Title className="pr-8 text-lg font-semibold">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-sm text-muted">
              {description}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">
              {title}
            </DialogPrimitive.Description>
          )}
          <div className="mt-5">{children}</div>
          <DialogPrimitive.Close
            aria-label="닫기"
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-field text-muted hover:bg-ink/5 hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Overlay>
    </DialogPrimitive.Portal>
  );
}

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export function AlertDialogContent({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className={overlayClass}>
        <AlertDialogPrimitive.Content className={panelClass}>
          <AlertDialogPrimitive.Title className="text-lg font-semibold">
            {title}
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-muted">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="mt-6 flex justify-end gap-2">{children}</div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Overlay>
    </AlertDialogPrimitive.Portal>
  );
}
