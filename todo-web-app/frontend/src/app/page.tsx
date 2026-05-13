// [Task]: T-3.4.8
import { redirect } from "next/navigation"
import { getSession } from "@/lib/get-session"
import GlassNavbar from "@/components/landing/GlassNavbar"
import HeroSection from "@/components/landing/HeroSection"
import BentoGrid from "@/components/landing/BentoGrid"
import Footer from "@/components/landing/Footer"

export default async function RootPage() {
  const session = await getSession()
  if (session) redirect("/dashboard")
  return (
    <div className="mesh-bg-landing min-h-screen">
      <GlassNavbar />
      <HeroSection />
      <BentoGrid />
      <Footer />
    </div>
  )
}
