import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import z from "zod";

const depositSchema = z.object({
  amount: z.coerce.number().positive()
})

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {

  await requireAuth()

  const user = await auth()
  const idUser = user?.user?.id

  const { id: idPot } = await context.params

  const potExists = await prisma.pots.findFirst({
    where: {idpot: idPot, fk_iduser: idUser}
  })

  if (!potExists) {
    return NextResponse.json({error: "Pot não existe"}, { status: 404 })
  }

  try {

    const body = await request.json()
    const { amount } = depositSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {

      const utilizer = await tx.users.findUnique({
        where: { iduser: idUser }
      })

      if (!utilizer ) {
        throw new Error("Usuário não encontrado")
      }

      if (utilizer.current_balance.toNumber() < amount) {
        throw new Error("Saldo insuficiente")
      }

      await tx.users.update({
        where: { iduser: idUser },
        data: { current_balance: { decrement: amount } }
      })

      const updatedPot = await tx.pots.update({
        where: { idpot: idPot },
        data: { total: { increment: amount } }
      })

      return updatedPot
    })

    return NextResponse.json({ data: result }, { status: 200 })

  } catch(e) {

    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }

    if (e instanceof Error && e.message === "Saldo insuficiente") {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Interrnal server error" }, { status: 500 })

  }
}
