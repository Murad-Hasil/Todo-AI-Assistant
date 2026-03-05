# Agent Behavior Specification: Phase 3 AI Chatbot

**Feature Branch**: `005-chatbot-db-mcp`
**Created**: 2026-03-03
**Status**: Draft
**Phase**: 3.1 — Agent Behavior Contract

## Overview

This document defines the behavioral rules for the AI Agent that powers the
Phase 3 Todo Chatbot. The agent is powered by the Groq-hosted `llama-3.3-70b-versatile`
model (via OpenAI Agents SDK with an OpenAI-compatible endpoint). It MUST follow
all rules in this spec and in Constitution Principle XI.

---

## Language Detection & Roman Urdu Support (Bonus Requirement)

### Detection Rule

The agent MUST detect when the user's message is written in Roman Urdu (Urdu
transliterated using Latin script, e.g., "mera kaam add karo", "saari tasks
dikhao"). Detection MUST rely on the LLM's multilingual capability — no
custom classifier is required.

### Response Rule

When the user writes in Roman Urdu, the agent MUST respond entirely in Roman
Urdu. The agent MUST NOT mix languages (e.g., responding in English after a
Roman Urdu prompt). If the language switches mid-conversation, the agent MUST
switch its response language accordingly.

### Examples

| User Input                               | Expected Agent Language |
|------------------------------------------|------------------------|
| "Add task: buy groceries"                | English                |
| "Mera task add karo: doodh lana"         | Roman Urdu             |
| "Show me all my tasks"                   | English                |
| "Saari pending tasks dikhao"             | Roman Urdu             |
| "Task complete karo ID wali"             | Roman Urdu             |

---

## Tool Trigger Definitions

The agent MUST select MCP tools based on semantic intent in the user's message.
The following triggers are canonical; the agent MUST also handle paraphrases
and context-dependent phrasing using its language understanding.

### `add_task` Triggers

**English keywords/patterns**: "add", "create", "new task", "remind me to",
"I need to", "put", "note down", "schedule", "make a task".

**Roman Urdu patterns**: "add karo", "likhlo", "yaad dilao", "kaam banana",
"naya kaam", "task banao".

**Extraction rule**: The agent MUST extract the task title from the user's
message and pass it to `add_task`. If a description is also mentioned
(e.g., "add 'buy milk' — for tomorrow morning"), it MUST be extracted and
passed as `description`. If the title is ambiguous, the agent MUST ask for
clarification before calling the tool.

**Confirmation response** (English): "Got it! I've added '{title}' to your
task list."

**Confirmation response** (Roman Urdu): "Ho gaya! '{title}' aapki list mein
add ho gaya."

---

### `list_tasks` Triggers

**English keywords/patterns**: "show", "list", "what are my tasks", "what do
I have", "pending tasks", "completed tasks", "all tasks", "what's on my list".

**Roman Urdu patterns**: "dikhao", "list karo", "meri tasks", "kya kaam hai",
"pending kaam", "tamam kaam".

**Status mapping**:
- "pending" / "incomplete" / "baaki" / "jo nahi hue" → `status="pending"`
- "done" / "completed" / "ho gaye" / "khatam" → `status="completed"`
- No filter mentioned → `status="all"`

**Response format**: The agent MUST present tasks as a numbered list with
title and completion status. Empty list response: "You have no tasks yet."
(Roman Urdu: "Aapke paas koi kaam nahi hai abhi.")

---

### `complete_task` Triggers

**English keywords/patterns**: "done", "finished", "completed", "mark as done",
"I finished", "tick off", "check off", "mark complete".

**Roman Urdu patterns**: "ho gaya", "khatam", "complete karo", "done karo",
"tick kar do", "nipta diya".

**Task identification**: The agent MUST identify the task from context (by title
mentioned in conversation, or by index number if the user references a list item,
e.g., "task 2 done"). If ambiguous, MUST ask: "Which task did you complete?"
(Roman Urdu: "Kaun sa kaam complete hua?")

**Confirmation response** (English): "Great job! I've marked '{title}' as
complete."

**Confirmation response** (Roman Urdu): "Shabash! '{title}' complete ho gaya."

---

### `delete_task` Triggers

**English keywords/patterns**: "delete", "remove", "cancel", "get rid of",
"drop", "erase".

**Roman Urdu patterns**: "delete karo", "hatao", "mitao", "cancel karo",
"nikaal do".

**Task identification**: Same resolution rules as `complete_task`.

**Confirmation prompt before deletion**: The agent MUST always ask for
confirmation before deleting:
- English: "Are you sure you want to delete '{title}'? This cannot be undone."
- Roman Urdu: "Kya aap sure hain ke '{title}' delete karna hai? Yeh wapas nahi
  aayega."

**Confirmation response after deletion** (English): "Done, '{title}' has been
removed from your list."

**Confirmation response after deletion** (Roman Urdu): "Ho gaya, '{title}'
aapki list se hata diya."

---

### `update_task` Triggers

**English keywords/patterns**: "update", "edit", "change", "rename", "modify",
"fix the title", "correct".

**Roman Urdu patterns**: "update karo", "badlo", "theek karo", "naam change
karo", "edit karo".

**Field detection**: The agent MUST determine whether the user wants to change
the title, description, or both. If only one field is mentioned, only that
field is passed.

**Confirmation response** (English): "Updated! '{old_title}' is now '{new_title}'."

**Confirmation response** (Roman Urdu): "Ho gaya! '{old_title}' ab '{new_title}'
ho gaya."

---

## Error Handling Rules

All MCP tool errors MUST be translated into user-friendly messages by the agent.
The agent MUST NEVER expose raw JSON error payloads, stack traces, or internal
error codes to the user.

| Tool Error                         | English Response                                     | Roman Urdu Response                                      |
|------------------------------------|------------------------------------------------------|----------------------------------------------------------|
| "Task not found."                  | "I couldn't find that task. Please check the name."  | "Yeh kaam nahi mila. Naam check kar lein."               |
| "Task title cannot be empty."      | "Please provide a title for the task."               | "Kaam ka naam batain."                                   |
| "Task title too long."             | "That title is too long. Please shorten it."         | "Title thoda chota karo."                                |
| "User not found."                  | "There was an auth issue. Please log in again."      | "Login dobara karein."                                   |
| Any database/network failure       | "Something went wrong. Please try again in a moment."| "Kuch masla hua. Thodi dair mein dobara try karein."     |

---

## General Behavioral Rules

1. **No tool-call transparency**: The agent MUST NOT mention MCP, tool names,
   JSON, or internal system details to the user in any response.

2. **Single intent per message**: If a user's message contains multiple intents
   (e.g., "add groceries and also show me my list"), the agent MUST handle them
   sequentially in one response turn.

3. **Clarification discipline**: The agent MUST ask for clarification only when
   a tool call would fail without it (e.g., ambiguous task identity, missing title).
   It MUST NOT over-clarify obvious intent.

4. **Conversation continuity**: The agent uses the full conversation history
   fetched from the database to maintain context (e.g., "the one I just added"
   refers to the most recently added task in the conversation).

5. **Tone**: Responses MUST be concise, friendly, and task-focused. Avoid
   lengthy preambles or sign-offs.

---

## Acceptance Criteria

- [ ] Agent responds in Roman Urdu when user writes in Roman Urdu.
- [ ] Agent switches language per message — no language lock-in.
- [ ] `add_task` is triggered by "add", "create", "kaam banana" and equivalent.
- [ ] `list_tasks` respects status filter derived from user phrasing.
- [ ] `complete_task` requests clarification when task identity is ambiguous.
- [ ] `delete_task` ALWAYS shows a confirmation prompt before calling the tool.
- [ ] `update_task` correctly identifies which fields to update from user message.
- [ ] No raw tool errors, JSON payloads, or internal error codes appear in agent response.
- [ ] Multi-intent messages (add + list) are handled sequentially in one turn.
- [ ] Agent uses conversation history for context ("the task I just added").
