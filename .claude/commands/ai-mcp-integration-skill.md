---
name: ai-mcp-integration-skill
description: Implements MCP servers and OpenAI Agents SDK logic for the Chatbot.
---

# AI & Model Context Protocol (MCP)

## Instructions
1. Build MCP servers using the Official MCP SDK to expose Todo CRUD as tools.
2. Implement the `add_task`, `list_tasks`, `complete_task`, `delete_task`, and `update_task` tools.
3. Use OpenAI Agents SDK to create a "Runner" that coordinates between the user message and MCP tools.
4. Ensure the chat history is persisted to Neon DB in a stateless manner.

## Examples
- Defining an MCP tool with `server.list_tools()`.
- Configuring the Agent Runner to handle natural language commands like "Reschedule my meetings."
