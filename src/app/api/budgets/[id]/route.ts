import { requireAuth } from "@/lib/utils"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import z from "zod"

const updateBudgetSchema = z.object({
  category: z.string().min(1).optional(),
  maximum: z.coerce.number().positive().optional(),
  theme: z.string().min(1).optional()
})


export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {

  await requireAuth()

  const user = await auth()
  const idUser = user?.user?.id
  const { id: budgetId } = await context.params

  try {
    const body = await request.json()

    const budgetUpdated = updateBudgetSchema.parse(body)

    const existentBudget = await prisma.budgets.findFirst({
      where: { idbudget: budgetId, fk_iduser: idUser }
    })

    if (!existentBudget) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 })
    }

    const savedBudget = await prisma.budgets.update({
      where: { idbudget: budgetId },
      data: budgetUpdated
    })

    return NextResponse.json({ data: savedBudget }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {

  await requireAuth()

  const user = await auth()
  const idUser = user?.user?.id
  const { id: budgetId } = await context.params

  try {
    const existentBudget = await prisma.budgets.findFirst({
      where: { idbudget: budgetId, fk_iduser: idUser }
    })

    if (!existentBudget) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 })
    }

    await prisma.budgets.delete({
      where: { idbudget: budgetId}
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
