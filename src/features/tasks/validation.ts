import { z } from 'zod'

export const taskStatusValues = ['todo', 'doing', 'done'] as const
export const taskPriorityValues = ['low', 'medium', 'high'] as const

export const taskStatusLabels: Record<(typeof taskStatusValues)[number], string> = {
  todo: '할 일',
  doing: '진행 중',
  done: '완료',
}

export const taskPriorityLabels: Record<(typeof taskPriorityValues)[number], string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
}

const optionalDateString = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  },
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), '마감일 형식이 올바르지 않습니다')
    .optional(),
)

const optionalText = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
  },
  z.string().max(500, '메모는 500자 이하여야 합니다').optional(),
)

export const taskUpsertSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력하세요').max(80, '제목은 80자 이하여야 합니다'),
  description: optionalText,
  status: z.enum(taskStatusValues).default('todo'),
  priority: z.enum(taskPriorityValues).default('medium'),
  dueDate: optionalDateString,
})

export const taskStatusSchema = z.object({
  taskId: z.string().min(1, '할 일을 찾을 수 없습니다'),
  status: z.enum(taskStatusValues),
})

export const taskIdSchema = z.object({
  taskId: z.string().min(1, '할 일을 찾을 수 없습니다'),
})