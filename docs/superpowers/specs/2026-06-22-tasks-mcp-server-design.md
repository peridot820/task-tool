# Tasks MCP Server — Design Spec

**Date:** 2026-06-22  
**Status:** Approved

## Overview

Add `server.ts` at the project root to expose the existing Prisma/SQLite task database as an MCP server. Claude Code already has `tasks` registered in its local MCP config (`npx tsx server.ts`), but the file does not exist. This spec defines what that file does.

## Scope

Read-only. Two tools: `list_tasks` and `get_task`. No writes, no auth filtering — all users' tasks are visible.

## Architecture

Single file: `server.ts` at project root.

**Dependencies to add:**
- `@modelcontextprotocol/sdk` (devDependency) — MCP server primitives

**Runtime:**
- `npx tsx server.ts` via stdio transport (matches existing MCP config)
- `DATABASE_URL` loaded from `.env` at startup using Node `fs` (no extra dotenv package)

## Tools

### `list_tasks`

Lists all tasks in the database across all users.

**Input schema:**
```json
{
  "status":   { "type": "string", "enum": ["todo", "in_progress", "done"], "optional": true },
  "priority": { "type": "string", "enum": ["low", "medium", "high"],       "optional": true }
}
```

**Returns:** Array of task objects, each with:
`id`, `title`, `description`, `status`, `priority`, `dueDate`, `createdAt`, `updatedAt`, `userEmail`

Results ordered by `createdAt` descending.

### `get_task`

Fetches a single task by ID.

**Input schema:**
```json
{
  "taskId": { "type": "string", "required": true }
}
```

**Returns:** Single task object (same fields as above), or error string if not found.

## Data Access

Imports `PrismaClient` from `@prisma/client` directly. `list_tasks` uses `prisma.task.findMany` with an optional `where` filter and `include: { user: { select: { email: true } } }`. `get_task` uses `prisma.task.findUnique`.

## Environment

`.env` is read with `fs.readFileSync` and parsed manually to extract `DATABASE_URL`. This avoids adding a `dotenv` dependency. If `DATABASE_URL` is already set in the process environment (e.g., passed via MCP env config), the file read is skipped.

## Error Handling

| Scenario | Behavior |
|---|---|
| `get_task` — unknown ID | Returns MCP error response with message |
| DB connection failure | Logs to stderr, returns MCP error response |
| Missing DATABASE_URL | Logs to stderr and exits with code 1 |

## Out of Scope

- Write operations (create, update, delete)
- Per-user filtering / authentication
- Pagination (acceptable for a personal task tool)
