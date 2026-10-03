import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCurrentBalance } from "@/lib/getUserCurrentBalance";
import { requireAuth } from "@/lib/utils";

export async function GET() {

  await requireAuth()
  const user = await auth()

  const iduser = user?.user?.id as string
  const currentBalance = await getUserCurrentBalance(iduser)
  return NextResponse.json({data: currentBalance}, {status: 200})

}
