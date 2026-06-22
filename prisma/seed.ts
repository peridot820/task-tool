import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: '데모 유저', passwordHash },
  })

  await prisma.task.deleteMany({ where: { userId: user.id } })
  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: '오늘의 우선순위 정리',
        description: '오전 중에 끝낼 일과 미룰 일을 나눈다.',
        status: 'doing',
        priority: 'high',
        dueDate: new Date('2026-06-22T12:00:00.000Z'),
      },
      {
        userId: user.id,
        title: '회의록 초안 작성',
        description: '월간 회고에서 나온 액션 아이템 정리',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2026-06-23T12:00:00.000Z'),
      },
      {
        userId: user.id,
        title: '배포 체크리스트 확인',
        description: '빌드, 환경변수, 로그를 마지막으로 점검한다.',
        status: 'done',
        priority: 'low',
      },
    ],
  })

  console.log('✅ 데모 유저 준비 완료: demo@example.com / password123')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })