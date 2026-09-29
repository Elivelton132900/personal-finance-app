import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAuth } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET() {

  await requireAuth()

  const user = await auth()

  const iduser = user?.user?.id as string
  const result = await prisma.$queryRaw`
    SELECT
    t."name",
    t.category,
    t.amount
    FROM "Transactions" AS t
    INNER JOIN "Users" as u
      ON t.fk_iduser = u.iduser
      AND t.recurring = true
      WHERE u.iduser = ${iduser}
  `

  const totalValueBills = await prisma.transactions.aggregate({
    where: { fk_iduser: iduser },
    _sum: { amount: true }
  })

  return NextResponse.json({ data: result, total: totalValueBills._sum }, { status: 200 })

}
