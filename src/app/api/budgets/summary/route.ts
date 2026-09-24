import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function GET() {

  const user = await auth()

  if (!user?.user?.id) {
    redirect('/login')
  }

  const iduser = user.user.id

  const result = await prisma.$queryRaw`
    WITH budgets AS (
      SELECT
        b.category,
        b.fk_iduser,
        b.maximum
      FROM "Budgets" as b
      INNER JOIN "Users" AS u ON b.fk_iduser = u.iduser
      WHERE u.iduser = ${iduser}
    ),

    amountByBudget AS (
      SELECT
        t.amount,
        b.category as budget_category,
        b.maximum
      FROM "Transactions" AS t
      INNER JOIN budgets AS b
        ON b.fk_iduser = t.fk_iduser
        AND t.category = b.category
    )

    SELECT
      SUM(a.amount),
      a.budget_category,
      a.maximum
    FROM amountByBudget AS a
    GROUP BY budget_category, maximum;
  `

    return NextResponse.json({budget: result}, {status: 200})

}
