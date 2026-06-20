import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind 클래스 충돌을 정리하며 합쳐주는 헬퍼
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
