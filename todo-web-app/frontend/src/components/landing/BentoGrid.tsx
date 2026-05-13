"use client"
// [Task]: T-3.4.11
// Client Component: passes Lucide icon components as props to BentoCard.
// Icon references (functions) cannot cross the Server→Client boundary,
// so BentoGrid must also be a Client Component.
import { Bot, Wrench, CheckSquare, Shield, Database, Globe } from "lucide-react"
import BentoCard from "./BentoCard"

const features = [
  {
    id: 1,
    title: "AI Chatbot",
    description:
      "Manage your tasks through natural language. Just tell the AI what you need and it handles the rest.",
    icon: Bot,
    colSpan: 2 as const,
    gradient:
      "radial-gradient(circle at 30% 50%, hsl(262, 83%, 58%), transparent)",
  },
  {
    id: 2,
    title: "MCP Integration",
    description:
      "Powered by the Model Context Protocol for reliable, tool-based AI agent actions.",
    icon: Wrench,
    colSpan: 1 as const,
    gradient:
      "radial-gradient(circle at 70% 30%, hsl(198, 93%, 60%), transparent)",
  },
  {
    id: 3,
    title: "Task Management",
    description:
      "Create, update, prioritize and complete tasks with a clean, intuitive interface.",
    icon: CheckSquare,
    colSpan: 1 as const,
    gradient:
      "radial-gradient(circle at 50% 70%, hsl(142, 71%, 45%), transparent)",
  },
  {
    id: 4,
    title: "JWT Auth",
    description:
      "Secure token-based authentication with Better Auth for seamless session management.",
    icon: Shield,
    colSpan: 1 as const,
    gradient:
      "radial-gradient(circle at 30% 30%, hsl(43, 96%, 56%), transparent)",
  },
  {
    id: 5,
    title: "Real-time Persistence",
    description:
      "All conversations and tasks backed by Neon Serverless PostgreSQL for zero data loss.",
    icon: Database,
    colSpan: 1 as const,
    gradient:
      "radial-gradient(circle at 70% 70%, hsl(225, 75%, 60%), transparent)",
  },
  {
    id: 6,
    title: "Roman Urdu Support",
    description:
      "The AI assistant understands and responds in Roman Urdu for multilingual workflows.",
    icon: Globe,
    colSpan: 2 as const,
    gradient:
      "radial-gradient(circle at 50% 50%, hsl(271, 91%, 65%), transparent)",
  },
]

export default function BentoGrid() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Everything you need
        </h2>
        <p className="text-white/60 text-lg max-w-xl mx-auto">
          A complete AI-powered task management platform built for productivity.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[200px] gap-4">
        {features.map((f) => (
          <BentoCard key={f.id} {...f} />
        ))}
      </div>
    </section>
  )
}
