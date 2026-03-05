// [Task]: T-3.4.19
import { redirect } from "next/navigation"
import { getSession } from "@/lib/get-session"
import DashboardShell from "@/components/dashboard/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")
  return (
    <DashboardShell userId={session.user.id}>{children}</DashboardShell>
  )
}
