"use client"
// [Task]: T-3.4.10
import { motion, useReducedMotion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { springTransition } from "@/lib/animations"

interface BentoCardProps {
  title: string
  description: string
  icon: LucideIcon
  colSpan?: 1 | 2
  gradient: string
}

export default function BentoCard({
  title,
  description,
  icon: Icon,
  colSpan = 1,
  gradient,
}: BentoCardProps) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <motion.div
      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.01 }}
      transition={springTransition}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 cursor-default",
        colSpan === 2 ? "sm:col-span-2" : "col-span-1",
      )}
    >
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: gradient }}
      />
      <div className="relative z-10">
        <div className="mb-4 inline-flex rounded-xl bg-white/10 p-2.5">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/60 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}
