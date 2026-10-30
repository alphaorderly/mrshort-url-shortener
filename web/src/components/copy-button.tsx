import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { copyText } from '@/lib/clipboard';
import { Button, type ButtonProps } from '@/components/ui/button';

export function CopyButton({
  text,
  label = '복사',
  variant = 'ghost',
  size = 'sm',
}: {
  text: string;
  label?: string;
} & Pick<ButtonProps, 'variant' | 'size'>) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function handleClick() {
    if (await copyText(text)) {
      toast.success('주소를 복사했습니다.');
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } else {
      toast.error('복사하지 못했습니다. 주소를 직접 선택해 복사하세요.');
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleClick}>
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {copied ? '복사됨' : label}
    </Button>
  );
}
