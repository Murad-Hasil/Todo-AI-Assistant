// [Task]: T-3.4.14 — backward-compat redirect
import { redirect } from "next/navigation"
export default function SignInPage() {
  redirect("/login")
}
