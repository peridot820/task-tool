# Slack Mention Bot Design Spec

**Date:** 2026-06-22  
**Status:** Draft

## Overview

Add a Slack bot that responds to `@mentions` in Slack and can read/write task data in this app. The bot will use Slack's Events API with an HTTP request URL, handle `app_mention` events, verify requests with Slack's signing secret, and post replies back to Slack with `chat.postMessage`.

This feature is intentionally scoped to a common, workspace-facing bot. It does not add per-Slack-user account linking. Instead, it operates against a single configured workspace owner account, so Slack commands read and write that shared task set consistently.

## Goals

- Let Slack users mention the bot and ask it to inspect task data.
- Let Slack users create, update, complete, and delete tasks through simple commands.
- Reuse the existing Prisma-backed task logic instead of duplicating database rules inside the Slack handler.
- Keep the public Slack endpoint safe with signature verification and event deduplication.

## Non-Goals

- Natural-language task parsing.
- Per-user Slack account mapping or OAuth linking.
- Interactive modals, buttons, or home tabs.
- Scheduled reminders or periodic digests.

## User Experience

Users mention the bot in a channel, for example:

```text
@task-tool list
@task-tool show 01J...
@task-tool create Fix login button | priority=high | due=2026-06-30
@task-tool done 01J...
```

The bot replies in the same channel thread, with a concise summary of what it read or changed. For write actions, the bot confirms what happened and includes the task ID so the user can follow up later.

## Command Model

The bot supports a small, explicit command set:

- `help` - show supported commands and examples.
- `list [status]` - list tasks, optionally filtered by `todo`, `doing`, or `done`.
- `show <taskId>` - show one task.
- `create <title> | [description] | [status=...] | [priority=...] | [due=YYYY-MM-DD]` - create a task.
- `update <taskId> | [title=...] | [description=...] | [status=...] | [priority=...] | [due=YYYY-MM-DD]` - update a task.
- `done <taskId>` - convenience command that marks a task complete.
- `delete <taskId>` - delete a task.

Parsing rules:

- The handler strips the bot mention before parsing.
- Command names are case-insensitive.
- Unknown flags are rejected with a help response rather than silently ignored.
- Validation errors are returned in Slack-friendly text, not raw Zod output.

## Architecture

### Routes

Add a route handler at `src/app/api/slack/events/route.ts`.

Responsibilities:

- Read the raw request body.
- Verify the Slack signature and timestamp.
- Respond to `url_verification`.
- Dispatch `app_mention` events to a Slack command processor.

### Feature Modules

Add a `src/features/slack/` area with small, focused helpers:

- `verification.ts` - Slack signature verification.
- `commands.ts` - command parsing and validation.
- `client.ts` - Slack Web API wrapper for posting messages.
- `handler.ts` - event routing and command execution.

### Task Reuse

Move task read/write operations into shared task service functions so both server actions and Slack can use the same rules.

Recommended shape:

- `src/features/tasks/service.ts` for task CRUD helpers.
- Existing queries and server actions call into this service.
- Slack calls the same service for list/show/create/update/delete operations.

This keeps ownership checks, date parsing, and status normalization in one place. Every Slack command resolves to the configured owner account before reading or writing tasks.

## Data Flow

1. Slack sends an HTTP POST to the Events API endpoint.
2. The route handler verifies the request using `X-Slack-Signature` and `X-Slack-Request-Timestamp`.
3. If the payload is `url_verification`, the handler returns the `challenge`.
4. If the payload is `app_mention`, the handler extracts the command text from the message.
5. The command processor validates the command and calls the shared task service.
6. The Slack client posts the result back into the originating channel, preferably in a thread.

## Security

### Request Verification

The endpoint must verify Slack requests using the signing secret, raw request body, and request timestamp. Requests older than five minutes are rejected to limit replay attacks.

### Event Deduplication

Slack can retry deliveries. Store processed `event_id` values in a small table so the same event is not applied twice.

### Scope Control

The bot only acts on `app_mention` events. It ignores other event types and ignores messages sent by the bot itself to avoid response loops.

## Data Model Changes

Add a lightweight deduplication model to Prisma:

- `SlackEvent` with `eventId`, `teamId`, `channelId`, `userId`, `payload`, `status`, `createdAt`, and `processedAt`.

Optional future refinement:

- Add a `workspace` or `source` field if we later need to distinguish Slack-originated task writes from UI-originated writes.

## Environment Variables

Add these environment variables:

- `SLACK_SIGNING_SECRET` - required for request verification.
- `SLACK_BOT_TOKEN` - required for posting reply messages.
- `SLACK_DEFAULT_TASK_OWNER_EMAIL` - required when the bot needs a consistent owner for created tasks.

The default owner email is used so Slack-created tasks have a stable user association in the existing user-centric schema. List/show/update/delete commands also scope to that same owner account.

## Error Handling

| Scenario | Behavior |
| --- | --- |
| Invalid signature | Return `401` and do not parse the payload further |
| Stale timestamp | Return `401` |
| `url_verification` | Return the Slack `challenge` immediately |
| Unknown command | Reply with help text |
| Validation error | Reply with a short, human-readable error |
| Missing task | Reply that the task could not be found |
| Duplicate event retry | Return `200` and skip reprocessing |
| Slack API failure | Log the failure and post a fallback message if possible |

The route should stay fast and avoid heavy work before acknowledging the event.

## Testing

Add unit tests for:

- Slack signature verification.
- Command parsing and flag handling.
- Command-to-task action mapping.
- Event deduplication behavior.
- Slack reply formatting.

Add route-level tests for:

- `url_verification`
- accepted `app_mention`
- rejected invalid signature
- duplicate event retries

Reuse the existing Vitest setup.

## Rollout

1. Add shared task service functions.
2. Add Slack verification and parsing helpers.
3. Add the Slack Events route handler.
4. Add the `SlackEvent` model and run the Prisma migration.
5. Wire up the Slack app configuration in production.
6. Test in a single channel first, then expand usage.

## Open Questions

- Do we want the bot replies to be thread-only, or also post a brief top-level confirmation?

## Acceptance Criteria

- A Slack mention reaches the app successfully.
- The bot responds to `help`, `list`, `show`, and at least one write command.
- Task mutations in Slack use the same underlying rules as the web app.
- Invalid Slack requests are rejected.
- Duplicate Slack deliveries do not create duplicate writes.
