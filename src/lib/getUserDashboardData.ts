// include no prisma

import { auth } from "@/auth";
import prisma from "./prisma";
import { redirect } from "next/navigation";


export async function getUserDashboardData() {

  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const iduser = session.user.id

  const userData = await prisma.users.findUnique({
    where: {
      iduser
    },
    include: {
      transactions: {
        orderBy: { created_at: 'desc' }
      },
      pots: true,
      budgets: true
    }
  })

  console.log(userData)

  return userData
}
