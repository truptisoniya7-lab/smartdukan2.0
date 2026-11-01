import { cn } from '@/shared/lib/cn';

type BadgeVariant = 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'blue';

const variantMap: Record<BadgeVariant, string> = {
  green:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  yellow: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  red:    'bg-red-500/15 text-red-400 border-red-500/20',
  purple: 'bg-brand-500/15 text-brand-300 border-brand-500/20',
  gray:   'bg-white/5 text-white/50 border-white/10',
  blue:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ variant = 'gray', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantMap[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', {
        'bg-emerald-400': variant === 'green',
        'bg-amber-400':   variant === 'yellow',
        'bg-red-400':     variant === 'red',
        'bg-brand-400':   variant === 'purple',
        'bg-white/50':    variant === 'gray',
        'bg-blue-400':    variant === 'blue',
      })} />}
      {children}
    </span>
  );
}

/** Stock level badge helper */
export function StockBadge({ qty, reorderPoint }: { qty: number; reorderPoint: number }) {
  if (qty === 0) return <Badge variant="red" dot>Out of stock</Badge>;
  if (qty <= reorderPoint) return <Badge variant="yellow" dot>Low stock</Badge>;
  return <Badge variant="green" dot>In stock</Badge>;
}
