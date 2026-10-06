import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockReset } from "vitest-mock-extended"
import { Decimal } from "@prisma/client/runtime/client"

vi.mock('@/lib/prisma', async () => {
  const { mockDeep } = await import('vitest-mock-extended')
  const mock = mockDeep()

  return {
    __esModule: true,
    default: mock,
    prisma: mock,
  }
})

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-123' } }),
}))


import prisma from "@/lib/prisma"
import { GET as getTransactions } from "@/app/api/transactions/route"

beforeEach(() => {
  mockReset(prisma)
})

describe('1. Transactions Filtering, Pagination and Search Capabilities', () => {

  it('Should paginate transactions correctly (page 1 with 10 items, page 2 with 5)', async () => {
    const pageOneItem = Array.from({ length: 10 }, (_, i) => ({ id: `${i + 1}`, title: `Item ${i + 1}` }))
    const pageTwoItem = Array.from({ length: 5 }, (_, i) => ({ id: `${i + 11}`, title: `Item ${i + 11}` }))

    vi.mocked(prisma.transactions.findMany)
      .mockResolvedValueOnce(pageOneItem as unknown as Awaited<ReturnType<typeof prisma.transactions.findMany>>)
      .mockResolvedValueOnce(pageTwoItem as unknown as Awaited<ReturnType<typeof prisma.transactions.findMany>>)

    const requestFirstPage = new Request('http://localhost:3000/api/transactions?pageParam=1')
    const requestSecondPage = new Request('http://localhost:3000/api/transactions?pageParam=2')

    const responsePageOne = await getTransactions(requestFirstPage)
    const responsePageTwo = await getTransactions(requestSecondPage)

    const dataPageOne = await responsePageOne.json()
    const dataPageTwo = await responsePageTwo.json()

    expect(prisma.transactions.findMany).toHaveBeenCalledTimes(2)

    expect(dataPageOne.data).toHaveLength(10)
    expect(dataPageTwo.data).toHaveLength(5)
  })

  it('Should search transactions by name case-insensitively', async () => {
    const matchingTransactions = [{
      idtransaction: "123",
      fk_iduser: "user-123",
      created_at: new Date(),
      avatar: "",
      category: "general",
      amount: new Decimal(100),
      name: "FKA store",
      recurring: false
    }]

    vi.mocked(prisma.transactions.findMany)
      .mockResolvedValueOnce(matchingTransactions as unknown as Awaited<ReturnType<typeof prisma.transactions.findMany>>)

    const searchFor = "fKa"
    const request = new Request(`http://localhost:3000/api/transactions?searchParam=${searchFor}`)

    const response = await getTransactions(request)
    const data = await response.json()

    expect(data.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "FKA store" })
      ])
    )

    expect(prisma.transactions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({
            contains: searchFor,
            mode: 'insensitive'
          })
        })
      })
    )
  })

  it('Should filter transactions by category without mixing others', async () => {
    const categoryToFilter = "general"

    const mockedTransactions = [
      {
        idtransaction: "123",
        fk_iduser: "user-123",
        created_at: new Date(),
        avatar: "",
        category: "general",
        amount: new Decimal(100),
        name: "FKA store",
        recurring: false
      },
      {
        idtransaction: "1234",
        fk_iduser: "user-1234",
        created_at: new Date(),
        avatar: "",
        category: "general",
        amount: new Decimal(100),
        name: "Groceries Store",
        recurring: false
      }
    ]

    vi.mocked(prisma.transactions.findMany)
      .mockResolvedValueOnce(mockedTransactions as unknown as Awaited<ReturnType<typeof prisma.transactions.findMany>>)

    const request = new Request(`http://localhost:3000/api/transactions?categoryParam=${categoryToFilter}`)

    const response = await getTransactions(request)
    const data = await response.json()

    expect(data.data).toHaveLength(2)

    expect(prisma.transactions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: expect.objectContaining({
            contains: categoryToFilter,
            mode: 'insensitive'
          })
        })
      })
    )
  })
})
