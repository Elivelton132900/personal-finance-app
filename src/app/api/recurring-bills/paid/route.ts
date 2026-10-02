import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAuth } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET() {

  await requireAuth()
  const user = await auth()
  const idUser = user?.user?.id

  const referenceDate = new Date()
  referenceDate.setUTCHours(0, 0, 0, 0,)

  try {
    const paidBIlls = await prisma.transactions.findMany({
      where: {
        fk_iduser: idUser,
        recurring: true,
        amount: { lt: 0 },
        created_at: { lt: referenceDate }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({ data: paidBIlls }, { status: 200 })

  } catch{
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }

}
