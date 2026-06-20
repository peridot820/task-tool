import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}
