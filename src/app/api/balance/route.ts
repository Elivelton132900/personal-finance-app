import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCurrentBalance } from "@/lib/getUserCurrentBalance";
import { requireAuth } from "@/lib/utils";

export async function GET() {

  const user = await auth()

  requireAuth()

  const iduser = user?.user?.id as string
  const currentBalance = await getUserCurrentBalance(iduser)

  console.log("current balance: ", currentBalance)

  return NextResponse.json({current_balance: currentBalance}, {status: 200})

}
