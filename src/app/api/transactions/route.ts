import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/utils"
import { Transactions } from "@prisma/client"
import { Prisma } from "@prisma/client"
import z from "zod"
import { Decimal } from "@prisma/client/runtime/client"

const transactionsQuerySchema = z.object({

  pageParam: z.coerce.number().int().min(1).catch(1),
  searchParam: z.string().default(""),
  categoryParam: z.string().default(""),

  orderby: z.enum([
    'latest',
    'oldest',
    'a-z',
    'z-a',
    'highest-value',
    'lowest-value'
  ]).catch('latest')

})

export async function GET(request: Request) {

  await requireAuth()

  const session = await auth()
  const iduser = session?.user?.id as string

  const { searchParams } = new URL(request.url)
  const paramsObject = Object.fromEntries(searchParams.entries())
  const { pageParam, searchParam, categoryParam, orderby } = transactionsQuerySchema.parse(paramsObject)
  const conditionsWhere: Prisma.TransactionsWhereInput = {
    fk_iduser: iduser
  }

  if (searchParam) {
    conditionsWhere.name = {
      contains: searchParam,
      mode: 'insensitive'
    }
  }

  const ordernationMap: Record<
    string,
    Prisma.TransactionsOrderByWithRelationInput> = {
    'latest': { created_at: 'desc' },
    'oldest': { created_at: 'asc' },
    'a-z': { name: 'asc' },
    'z-a': { name: 'desc' },
    'highest-value': { amount: 'desc' },
    'lowest-value': { amount: 'asc' }
  }

  const ordernation = ordernationMap[orderby] || { created_at: 'desc' }

  if (categoryParam) {
    conditionsWhere.category = {
      contains: categoryParam,
      mode: 'insensitive'
    }
  }


  let transactions: Transactions[] | null = null
  let totalCount = 0

  const page = Math.max(Number(pageParam), 1)

  const itensPerPage = 10
  const itensPerSkip = (page - 1) * itensPerPage;


  [transactions, totalCount] = await Promise.all([
    prisma.transactions.findMany({
      where: conditionsWhere,
      take: itensPerPage,
      skip: itensPerSkip,
      orderBy: ordernation
    }),
    prisma.transactions.count({
      where: conditionsWhere
    })
  ])

  const totalPages = Math.ceil(totalCount / itensPerPage)

  return NextResponse.json({
    data: transactions,
    meta: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalCount
    }
  }, { status: 200 })
}

const transactionSchema = z.object({
  amount: z.number(),
  avatar: z.string(),
  category: z.string().min(1),
  name: z.string().min(3),
  recurring: z.boolean()
})

export async function POST(request: Request) {

  await requireAuth()

  try {
    const user = await auth()
    const idUser = user?.user?.id as string

    const body = await request.json()
    const validatedBody = transactionSchema.parse(body)

    const budgets = await prisma.budgets.findMany({
      where: { fk_iduser: idUser }
    })

    const categorys = budgets.map((budget) => budget.category)

    if (!categorys.includes(validatedBody.category)) {
      return NextResponse.json({ error: "Category does not exist" }, { status: 404 })
    }

    const result = await prisma.transactions.create({
      data: {
        amount: new Decimal(validatedBody.amount),
        avatar: validatedBody.avatar,
        category: validatedBody.category,
        name: validatedBody.name,
        fk_iduser: idUser
      }
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch(e) {

    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }

    return NextResponse.json({error: "Internal server error"}, { status: 500 })
  }
}
