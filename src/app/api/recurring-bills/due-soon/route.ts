import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAuth } from "@/lib/utils";
import prisma from "@/lib/prisma";

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
      return NextResponse.json({ data: [] }, { status: 200  })
    }

    const referenceDate = new Date(mostRecentTransaction.created_at)
    const endDate = new Date(referenceDate)
    endDate.setDate(endDate.getDate() + 5)
    endDate.setUTCHours(23, 59, 59, 999)

    const transactionsInPeriod = await prisma.transactions.findMany({
      where: {
        fk_iduser: idUser,
        recurring: true,
        amount: { lt: 0 },
        created_at: {
          gt: referenceDate,
          lte: endDate
        }
      },
      orderBy: { created_at: "desc" }
    })

    return NextResponse.json({ data: transactionsInPeriod }, { status: 200 })

  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

}
