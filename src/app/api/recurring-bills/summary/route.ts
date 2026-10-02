import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAuth } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET() {

  await requireAuth()

  const user = await auth()
  const idUser = user?.user?.id

  try {
    const vendors = await prisma.$queryRaw`
    SELECT DISTINCT ON (t.name)
      t.name,
      t.category,
      t.amount,
      t.created_at
    FROM "Transactions" as t
    WHERE t.recurring = true AND t.fk_iduser = ${idUser}
    ORDER BY t.name, t.created_at DESC;
  `

    console.log("vendors e id ", vendors, idUser)
    return NextResponse.json({ data: vendors }, { status: 200 })

  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

}
