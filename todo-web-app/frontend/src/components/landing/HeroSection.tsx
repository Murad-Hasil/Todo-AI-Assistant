"use client"
// [Task]: T-3.4.9
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import {
  fadeInUp,
  staggerContainer,
  springTransition,
  reducedVariants,
} from "@/lib/animations"

export default function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  const variants = shouldReduceMotion ? reducedVariants(fadeInUp) : fadeInUp
  const containerVariants = shouldReduceMotion ? {} : staggerContainer

  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto"
      >
        <motion.div
          variants={variants}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }
          }
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs text-white/70 mb-8 backdrop-blur-sm">
            ✨ AI-powered task management
          </span>
        </motion.div>
        <motion.h1
          variants={variants}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.6, ease: "easeOut", delay: 0.1 }
          }
          className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
        >
          Manage tasks with{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            AI intelligence
          </span>
        </motion.h1>
        <motion.p
          variants={variants}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.6, ease: "easeOut", delay: 0.2 }
          }
          className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10"
        >
          TodoAI lets you manage your tasks through natural language. Add, update,
          and organize your work just by chatting with our AI assistant.
        </motion.p>
        <motion.div
          variants={variants}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.6, ease: "easeOut", delay: 0.3 }
          }
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            transition={springTransition}
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 text-base font-semibold text-white transition-colors min-w-[160px]"
            >
              Get Started Free
            </Link>
          </motion.div>
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            transition={springTransition}
          >
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition-colors min-w-[160px] backdrop-blur-sm"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
