// 모든 폼 서버 액션이 공유하는 반환 타입(useActionState와 함께 사용)
export type FormState =
  | {
      error?: string // 폼 전체 에러 메시지
      success?: string // 성공 메시지
      fieldErrors?: Record<string, string[] | undefined> // 필드별 검증 에러
    }
  | undefined
