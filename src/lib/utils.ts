import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {

  const user = await auth()

  if (!user?.user?.id) {
    redirect('/login')
  }

}
