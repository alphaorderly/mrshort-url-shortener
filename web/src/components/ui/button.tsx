import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-field font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-paper hover:bg-ink/85',
        secondary: 'border border-line-strong text-ink hover:bg-ink/5',
        ghost: 'text-muted hover:bg-ink/5 hover:text-ink',
        danger: 'bg-danger text-paper hover:bg-danger/90',
      },
      size: {
        lg: 'h-14 rounded-panel px-8 text-lg',
        md: 'h-11 px-5 text-base',
        sm: 'h-9 px-3 text-sm',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
