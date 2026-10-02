import { vi, beforeEach } from 'vitest'
import { mockDeep, mockReset } from 'vitest-mock-extended'
import { PrismaClient } from '@prisma/client'
import prisma from '@/lib/prisma'

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body, options) => ({
        data: body.data,
        error: body.error,
        status: options?.status || 200,
      })),
    },
  }
})

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'test-user-id-123' } }),
}))

vi.mock('@/lib/utils', () => ({
  requireAuth: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockReset(prisma)
})
