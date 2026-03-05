---
title: Todo AI Assistant
emoji: 🤖
sdk: docker
app_port: 7860
---

# Todo AI Assistant

A full-stack AI-powered Todo application built with:

- **Backend**: FastAPI + SQLModel + Neon PostgreSQL + Groq AI (port 7860)
- **Frontend**: Next.js 14+ + Better Auth + Tailwind CSS (Vercel)
- **AI**: OpenAI Agents SDK (Groq llama-3.3-70b-versatile) + MCP tools

## Environment Variables (Required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Shared HS256 secret (must match frontend) |
| `GROQ_API_KEY` | Groq API key from console.groq.com |
| `CORS_ORIGINS` | Comma-separated allowed origins |
