import prisma from "./prisma";

export async function getUserCurrentBalance(iduser: string) {

  const potsSum = await prisma.pots.aggregate({
    where: { fk_iduser: iduser },
    _sum: { total: true }
  })

  const transactionsSum = await prisma.transactions.aggregate({
    where: { fk_iduser: iduser },
    _sum: { amount: true }
  })

  const pots = Number(potsSum._sum.total || 0)
  const transactions = Number(transactionsSum._sum.amount || 0)

  return transactions - pots
}
// fazer abordagem dinamica, calcular valores na hora aa partir das transações. remover campos
// expenses, income e current_balance futuramente da tabela users.
