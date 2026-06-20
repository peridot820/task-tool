import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Button({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
