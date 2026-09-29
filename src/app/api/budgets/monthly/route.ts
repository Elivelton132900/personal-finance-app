import { requireAuth } from '@/lib/utils';
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import z from 'zod';


const summaryQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000)
})

export async function GET(request: Request) {

  await requireAuth()

  const user = await auth()
  const idUser = user?.user?.id as string

  try {
    const { searchParams } = new URL(request.url)
    const paramsObject = Object.fromEntries(searchParams.entries())
    const { month, year } = summaryQuerySchema.parse(paramsObject)

    const initialDate = new Date(year, month - 1, 1)
    const finalDate = new Date(year, month, 1)

    const aggregations = await prisma.transactions.aggregate({
      where: {
        fk_iduser: idUser,
        amount: { lt: 0 },
        created_at: {
          gte: initialDate,
          lt: finalDate
        }
      },
      _sum: {
        amount: true
      }
    })

    const totalSpent = aggregations._sum.amount || 0

    return NextResponse.json({
      data: {
        period: { month, year },
        totalSpent: totalSpent
      }
    }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error:  "Mês ou ano inválidos na URL"}, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

}
