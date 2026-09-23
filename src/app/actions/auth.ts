'use server'

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function loginAction(prevState: unknown, formData: FormData) {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/dashboard'
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: 'E-mail ou senha incorretos.' }
        default:
          return { error: "Ocorreu um erro no servidor." }
      }
    }

    throw error
  }
}
