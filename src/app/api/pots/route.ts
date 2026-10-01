import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireAuth } from "@/lib/utils";
import prisma from "@/lib/prisma";
import z from "zod";

const potSchema = z.object({
  name: z.coerce.string().min(2).max(40),
  theme: z.coerce.string().min(4).max(9),
  target: z.coerce.number().min(10).max(1000000),
})

export async function GET() {

  await requireAuth()

  const user = await auth()

  const iduser = user?.user?.id as string
  const result = await prisma.$queryRaw`
    SELECT
	    p."name",
	    total
    FROM "Pots" AS p
    INNER JOIN "Users" as u
    ON p.fk_iduser = u.iduser
    WHERE u.iduser = ${iduser}
  `
  const totalValue = await prisma.pots.aggregate({
    where: { fk_iduser: iduser },
    _sum: { total: true }
  })

  return NextResponse.json({ data: result, totalValue: totalValue._sum }, { status: 200 })

}


export async function POST(request: Request) {

  await requireAuth()

  const user = await auth()
  const idUser = user?.user?.id as string

  try {
    const body = await request.json()

    const { name, theme, target } = potSchema.parse(body)

    const potExist = await prisma.pots.findFirst({
      where: {
        fk_iduser: idUser,
        name: name
      }
    })

    if (potExist) {
      return NextResponse.json({"error": "Item duplicado"}, { status: 409 })
    }

    const newPot = await prisma.pots.create({
      data: {
        fk_iduser: idUser,
        name,
        theme,
        target,
        total: 0
      }
    })

    return NextResponse.json({data: newPot}, { status: 201 })

  } catch (error) {

    if(error instanceof z.ZodError) {
      return NextResponse.json({error: error.message}, { status: 400 })
    }

    return NextResponse.json({error: "Internal server error"}, { status: 500 })
  }


}
