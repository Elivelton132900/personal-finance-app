import { requireAuth } from '@/lib/utils';
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import z from 'zod';

const createBudgetSchema = z.object({
  category: z.string().min(1, "A categoria é obrigatória"),
  maximum: z.number().positive("O valor máximo deve ser positivo"),
  theme: z.string().min(1, "O tema (cor) é obrigatório")
})

export async function POST(request: Request) {

  await requireAuth()

  const session = await auth()
  const iduser = session?.user?.id as string

  try {

    const body = await request.json()

    const { category, maximum, theme } = createBudgetSchema.parse(body)

    const categoryExists = await prisma.budgets.findFirst({
      where: {
        category: category,
        fk_iduser: iduser
      }
    })

    if (categoryExists) {
      return NextResponse.json({ error: "Categoria já existe" }, { status: 409 })
    }

    const newBudget = await prisma.budgets.create({
      data: {
        fk_iduser: iduser,
        category,
        maximum,
        theme
      }
    })

    return NextResponse.json({ data: newBudget }, { status: 201 })

  } catch (error) {

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })

  }

}

export async function GET() {

  await requireAuth()

  const user = await auth()
  const idUser = user?.user?.id

  const budgets = await prisma.budgets.findMany({
    where: {fk_iduser: idUser}
  })

  return NextResponse.json({ data: budgets }, { status: 200 })
}
