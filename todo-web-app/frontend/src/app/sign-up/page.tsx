// [Task]: T-3.4.15 — backward-compat redirect
import { redirect } from "next/navigation"
export default function SignUpPage() {
  redirect("/register")
}
