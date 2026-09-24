import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserCurrentBalance } from "@/lib/getUserCurrentBalance";

export async function GET() {

  const user = await auth()

  if (!user?.user?.id) {
    redirect('/login')
  }

  const iduser = user.user.id
  const currentBalance = await getUserCurrentBalance(iduser)

  console.log("current balance: ", currentBalance)

  return NextResponse.json({current_balance: currentBalance}, {status: 200})

}
