import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node' }, // 테스트는 Node 환경에서 실행
  resolve: { tsconfigPaths: true }, // tsconfig의 @/* 별칭을 네이티브로 해석(플러그인 불필요)
})
