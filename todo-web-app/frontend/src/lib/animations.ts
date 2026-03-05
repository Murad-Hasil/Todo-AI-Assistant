// [Task]: T-3.4.3
import type { Variants, Transition } from "framer-motion"

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

export const slideInRight: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
}

export const springTransition: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
}

export const easeTransition: Transition = {
  duration: 0.4,
  ease: [0.25, 0.1, 0.25, 1],
}

export function reducedVariants(variants: Variants): Variants {
  return Object.fromEntries(
    Object.keys(variants).map((k) => [k, { opacity: 1, x: 0, y: 0 }]),
  )
}
