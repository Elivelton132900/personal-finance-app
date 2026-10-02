import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAuth } from "@/lib/utils";
import prisma from "@/lib/prisma";

// demais faturas do mês, tudo aquilo que vem depois da janela de 5 dias do endpoint due-soon
export async function GET() {
  await requireAuth()
  const user = await auth()
  const idUser = user?.user?.id

  try {
    const mostRecentTransaction = await prisma.transactions.findFirst({
       where: { fk_iduser: idUser, recurring: false },
       orderBy: { created_at: "desc" }
    })

    if (!mostRecentTransaction) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const referenceDate = new Date(mostRecentTransaction.created_at)

    const dueSoonEnd = new Date(referenceDate)
    dueSoonEnd.setDate(dueSoonEnd.getDate() + 5)
    dueSoonEnd.setUTCHours(23, 59, 59, 999)

    const lastDayOfMonth = new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth() + 1, 0))
    lastDayOfMonth.setUTCHours(23, 59, 59, 999)

    const upcomingBills = await prisma.transactions.findMany({
      where: {
        fk_iduser: idUser,
        recurring: true,
        amount: { lt: 0 },
        created_at: {
          gt: dueSoonEnd,
          lte: lastDayOfMonth
        }
      },
      orderBy: { created_at: "asc" }
    })

    return NextResponse.json({ data: upcomingBills }, { status: 200 })

  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
