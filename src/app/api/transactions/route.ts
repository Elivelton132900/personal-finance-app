import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { requireAuth } from "@/lib/utils"
import { Transactions } from "@prisma/client"
import { Prisma } from "@prisma/client"
import z from "zod"

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

  const itensPorPagina = 10
  const itensParaPular = (page - 1) * itensPorPagina;


  [transactions, totalCount] = await Promise.all([
    prisma.transactions.findMany({
      where: conditionsWhere,
      take: itensPorPagina,
      skip: itensParaPular,
      orderBy: ordernation
    }),
    prisma.transactions.count({
      where: conditionsWhere
    })
  ])

  const totalPages = Math.ceil(totalCount / itensPorPagina)

  return NextResponse.json({
    data: transactions,
    meta: {
      currentPage: page,
      totalPages: totalPages,
      totalItems: totalCount
    }
  }, { status: 200 })
}
