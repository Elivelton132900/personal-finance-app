import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAuth } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET() {

  const user = await auth()

  requireAuth()

  const iduser = user?.user?.id as string
  console.log(iduser)
  const result = await prisma.$queryRaw`
    SELECT
	    p."name",
	    total
    FROM "Pots" AS p
    INNER JOIN "Users" as u
    ON p.fk_iduser = u.iduser
    WHERE u.iduser = ${ iduser }
  `
  const totalValue = await prisma.pots.aggregate({
    where: { fk_iduser: iduser },
    _sum: { total: true }
  })

  return NextResponse.json({pots: result, totalValue: totalValue._sum}, {status: 200})

}
