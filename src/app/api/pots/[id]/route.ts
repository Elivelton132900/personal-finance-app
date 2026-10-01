import { requireAuth } from "@/lib/utils"
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import z from "zod"

const potSchema = z.object({
  name: z.coerce.string().min(2).max(40),
  theme: z.coerce.string().min(4).max(9),
  target: z.coerce.number().min(10).max(1000000),
})

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {

  await requireAuth()

  const user = await auth()
  const idUser = user?.user?.id
  const { id: idPot } = await context.params

  try {
    const body = await request.json()

    const potUpdated = potSchema.parse(body)

    const existentBudget = await prisma.pots.findFirst({
      where: { idpot: idPot, fk_iduser: idUser }
    })

    if (!existentBudget) {
      return NextResponse.json({ error: "Pot não encontrado" }, { status: 404 })
    }

    const savedPot = await prisma.pots.update({
      where: { idpot: idPot },
      data: potUpdated
    })

    return NextResponse.json({ data: savedPot }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {

  await requireAuth()

  const user = await auth()
  const idUser = user?.user?.id
  const { id: idPot } = await context.params

  try {
    const existentPot = await prisma.pots.findFirst({
      where: { idpot: idPot, fk_iduser: idUser }
    })

    if (!existentPot) {
      return NextResponse.json({ error: "Pots não encontrado" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {

      const utilizer = await tx.users.findUnique({
        where: { iduser: idUser }
      })

      if (!utilizer) {
        throw new Error("Usuário não encontrado")
      }

      const amount = existentPot.total.toNumber()

      await tx.pots.delete({
        where: { idpot: idPot, fk_iduser: idUser }
      })

      await tx.users.update({
        where: {iduser: idUser},
        data: {current_balance: { increment: amount }}
      })
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {

  await requireAuth()

  try {
    const user = await auth()
    const userId = user?.user?.id as string

    const { id: idpot } = (await context.params)

    const pot = await prisma.pots.findFirst({
      where: {
        fk_iduser: userId,
        idpot: idpot
      }
    })

    if (!pot) {
      return NextResponse.json({ error: "Pot não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ data: pot })
  } catch(e) {

    if (e instanceof Error && e.message == "Usuário não encontrado") {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
