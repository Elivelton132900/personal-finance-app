import { describe, it, expect, vi } from "vitest"

import { GET as getBalance } from "@/app/api/balance/route"
import { GET as getBudgets } from "@/app/api/budgets/route"
import { GET as getMonthlyBudgets } from "@/app/api/budgets/monthly/route"
import { GET as getBudgetsSummary } from "@/app/api/budgets/summary/route"
import { GET as getPots } from "@/app/api/pots/route"
import { GET as getPotById } from "@/app/api/pots/[id]/route"
import { GET as getRecurringBills } from "@/app/api/recurring-bills/route"
import { GET as getDueSoonBills } from "@/app/api/recurring-bills/due-soon/route"
import { GET as getPaidBills } from "@/app/api/recurring-bills/paid/route"
import { GET as getRecurringBillsSummary } from "@/app/api/recurring-bills/summary/route"
import { GET as getUpcomingBills } from "@/app/api/recurring-bills/upcoming/route"
import { GET as getTransactions } from "@/app/api/transactions/route"
import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/utils"

import { POST as createBudget } from "@/app/api/budgets/route"
import { POST as createPot } from "@/app/api/pots/route"
import { POST as depositToPot } from "@/app/api/pots/[id]/transfer/deposit/route"
import { POST as withdrawFromPot } from "@/app/api/pots/[id]/transfer/withdraw/route"

import { PUT as updateBudget } from "@/app/api/budgets/[id]/route"
import { PUT as updatePot } from "@/app/api/pots/[id]/route"

import { DELETE as deleteBudget } from "@/app/api/budgets/[id]/route"
import { DELETE as deletePot } from "@/app/api/pots/[id]/route"
import prisma from "@/lib/prisma"
import { Decimal } from "@prisma/client/runtime/client"



describe('1. Unauthenticated Access Protection (Route Guard)', () => {

  const dummyRequest = new NextRequest("http://localhost:3000/api/falso-endpoint")
  const dummyContext = { params: Promise.resolve({ id: "123" }) }

  const getEndpoints = [
    { name: "GET /api/balance", handler: () => getBalance() },
    { name: "GET /api/budgets", handler: () => getBudgets() },
    { name: "GET /api/budgets/monthly", handler: () => getMonthlyBudgets(dummyRequest) },
    { name: "GET /api/budgets/summary", handler: () => getBudgetsSummary() },
    { name: "GET /api/pots", handler: () => getPots() },
    { name: "GET /api/pots/[id]", handler: () => getPotById(dummyRequest, dummyContext) },
    { name: "GET /api/recurring-bills", handler: () => getRecurringBills() },
    { name: "GET /api/recurring-bills/due-soon", handler: () => getDueSoonBills() },
    { name: "GET /api/recurring-bills/paid", handler: () => getPaidBills() },
    { name: "GET /api/recurring-bills/summary", handler: () => getRecurringBillsSummary() },
    { name: "GET /api/recurring-bills/upcoming", handler: () => getUpcomingBills() },
    { name: "GET /api/transactions", handler: () => getTransactions(dummyRequest) },
  ]

  const postEndpoints = [
    { name: "POST /api/budgets", handler: () => createBudget(dummyRequest) },
    { name: "POST /api/pots", handler: () => createPot(dummyRequest) },
    { name: "POST /api/pots/[id]/transfer/deposit", handler: () => depositToPot(dummyRequest, dummyContext) },
    { name: "POST /api/pots/[id]/transfer/withdraw", handler: () => withdrawFromPot(dummyRequest, dummyContext) },
  ]

  const mutationEndpoints = [
    // PUT
    { name: "PUT /api/budgets/[id]", handler: () => updateBudget(dummyRequest, dummyContext) },
    { name: "PUT /api/pots/[id]", handler: () => updatePot(dummyRequest, dummyContext) },

    // DELETE
    { name: "DELETE /api/budgets/[id]", handler: () => deleteBudget(dummyRequest, dummyContext) },
    { name: "DELETE /api/pots/[id]", handler: () => deletePot(dummyRequest, dummyContext) },
  ]


  const NEXT_REDIRECT_OR_401 = "NEXT_REDIRECT_OR_401"

  it.each(getEndpoints)('should block unauthenticated access to the endpoint $name', async ({ handler }) => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error(NEXT_REDIRECT_OR_401))

    await expect(handler()).rejects.toThrow(NEXT_REDIRECT_OR_401)
  })

  it.each(postEndpoints)('should block unauthenticated post access to the endpoint $name', async ({ handler }) => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error(NEXT_REDIRECT_OR_401))

    await expect(handler()).rejects.toThrow(NEXT_REDIRECT_OR_401)
  })

  it.each(mutationEndpoints)('should block unauthenticated mutation actions to the endpoint $name', async ({ handler }) => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error(NEXT_REDIRECT_OR_401))

    await expect(handler).rejects.toThrow(NEXT_REDIRECT_OR_401)
  })

})

describe('2. Cross-User Data Isolation and IDOR Protection', () => {
  const dummyRequest = new NextRequest("http://localhost:3000/api/falso-endpoint")
  const dummyContext = { params: Promise.resolve({ id: "recurso-do-usuario-b-999" }) }

  const isolatedEndpoints = [
    // --- POTS ---
    {
      name: "GET /api/pots/[id]",
      expectedStatus: 404,
      handler: () => getPotById(dummyRequest, dummyContext),
    },
    {
      name: "PUT /api/pots/[id]",
      expectedStatus: 404,
      handler: () => updatePot(new NextRequest("http://localhost:3000/api/falso-endpoint", {
        method: "PUT",
        body: JSON.stringify({ name: "Nome", theme: "green", target: 500 })
      }), dummyContext),
    },
    {
      name: "DELETE /api/pots/[id]",
      expectedStatus: 404,
      handler: () => deletePot(dummyRequest, dummyContext),
    },
    {
      name: "POST /api/pots/[id]/transfer/deposit",
      expectedStatus: 404,
      handler: () => depositToPot(new NextRequest("http://localhost:3000/api/falso-endpoint", {
        method: "POST",
        body: JSON.stringify({ amount: 100 })
      }), dummyContext),
    },
    {
      name: "POST /api/pots/[id]/transfer/withdraw",
      expectedStatus: 404,
      handler: () => withdrawFromPot(new NextRequest("http://localhost:3000/api/falso-endpoint", {
        method: "POST",
        body: JSON.stringify({ amount: 50 })
      }), dummyContext),
    },

    // --- BUDGETS ---
    {
      name: "PUT /api/budgets/[id]",
      expectedStatus: 404,
      handler: () => updateBudget(new NextRequest("http://localhost:3000/api/falso-endpoint", {
        method: "PUT",
        body: JSON.stringify({ category: "Lazer", maximum: 500, theme: "blue" })
      }), dummyContext),
    },
    {
      name: "DELETE /api/budgets/[id]",
      expectedStatus: 404,
      handler: () => deleteBudget(dummyRequest, dummyContext),
    },
  ]

  it.each(isolatedEndpoints)('should block User A from accessing $name belonging to User B', async ({ handler }) => {

    const mockRecordNotFound = () => {
      vi.mocked(prisma.budgets.findFirst).mockResolvedValueOnce(null)
      vi.mocked(prisma.budgets.create).mockResolvedValueOnce({
        "fk_iduser": "dd",
        "theme": "aa",
        "category": "bb",
        "idbudget": "cc",
        "maximum": new Decimal(500)
      })
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ name: "Reserva", total: 100 }])
      vi.mocked(prisma.pots.aggregate).mockResolvedValueOnce({ _sum: { total: new Decimal(100) }, } as unknown as Awaited<ReturnType<typeof prisma.pots.aggregate>>)
    }

    mockRecordNotFound()

    const response = await handler()

    expect(response.status).toBe(404)

  })
})
