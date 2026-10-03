import { Decimal } from '@prisma/client/runtime/client';
import { describe, it, expect, vi } from "vitest"
import { GET as getBalance } from "@/app/api/balance/route"
import { getUserCurrentBalance } from "@/lib/getUserCurrentBalance"
import prisma from "@/lib/prisma"

describe("1. Overview Test - Mathematic Calculus of Current Balance", () => {

  const mockUserId = 'user-test-123'

  it("MUst calculate correctly the balance (transactions - pots)", async () => {
    const totalTransactionsSum = new Decimal(3300.00)
    const totalPotsSum = new Decimal(1000.00)
    const expectedBalance = new Decimal(2300.00)

    vi.mocked(prisma.pots.aggregate).mockResolvedValueOnce({
      _sum: { total: totalPotsSum },
      _avg: {},
      _count: {},
      _min: {},
      _max: {}
    })

    vi.mocked(prisma.transactions.aggregate).mockResolvedValueOnce({
      _sum: { amount: totalTransactionsSum },
      _avg: {},
      _count: {},
      _min: {},
      _max: {}
    })

    const balance = new Decimal(await getUserCurrentBalance(mockUserId))
    expect(balance).toStrictEqual(expectedBalance)

  })

  it('Must return correct balance to authenticated user at GET route /api/balance', async () => {

    vi.mocked(prisma.pots.aggregate).mockResolvedValueOnce({
      _sum: { total: new Decimal(500) },
      _avg: {}, _count: {}, _min: {}, _max: {},
    })

    vi.mocked(prisma.transactions.aggregate).mockResolvedValueOnce({
      _sum: { amount: new Decimal(2000) },
      _avg: {}, _count: {}, _min: {}, _max: {},
    })

    const response = await getBalance()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toBe(1500)
  })

  it('Must return 0 when user do not have transactions neither pots', async () => {
    vi.mocked(prisma.pots.aggregate).mockResolvedValueOnce({
      _sum: { total: null },
      _avg: {}, _count: {}, _min: {}, _max: {},
    })

    vi.mocked(prisma.transactions.aggregate).mockResolvedValueOnce({
      _sum: { amount: null },
      _avg: {}, _count: {}, _min: {}, _max: {},
    })

    const balance = await getUserCurrentBalance(mockUserId)

    expect(balance).toBe(0)
  })
})
