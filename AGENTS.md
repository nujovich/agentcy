<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

---

# MANDATORY for ALL agents (Claude, Hermes, or any other)

**Before writing a single line of code, read `CLAUDE.md` in full. No exceptions.**

This is not optional. CLAUDE.md is the authoritative ruleset for this codebase. Skipping it will produce broken, non-compliant code that will be rejected.

## What CLAUDE.md enforces (summary — read the full file, not just this)

- **Provider Registry**: Never import `@ai-sdk/anthropic`, `@ai-sdk/openai`, or `@ai-sdk/google` outside of `src/agents/provider-registry.ts`. All agents receive an `AgentProvider` instance — they never touch the SDK directly.
- **TypeScript strict mode**: No `any`, no `as unknown`, no `@ts-ignore`. All agent outputs validated with Zod before persisting.
- **Supabase multi-tenancy**: Every query must filter by `agency_id` explicitly. RLS is a second line of defense, not the only one.
- **Human in the loop**: No agent output is auto-approved. Flow is always: generate → user reviews/edits → user approves → persist. The next pipeline step only runs if the previous one has `status: 'approved'`.
- **Streaming required**: All agents stream via Vercel AI SDK (`streamText` on the route, `useCompletion` on the client).
- **Implementation order**: Types → Provider Registry → Supabase schema → Agent + API route → UI. Never skip to UI without the prior steps working end-to-end.
- **One agent at a time**: Do not start the next agent until the current one works end-to-end.

## If you are Hermes

You are coding in a production multi-tenant SaaS. The rules above are not suggestions. Read `CLAUDE.md` before every coding session, even if you have read it before — it may have been updated.
<!-- END:nextjs-agent-rules -->
