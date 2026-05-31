<!-- BEGIN:agentcy-rules -->
# AGENTS.md — Awake Agentic SaaS

Estas reglas son obligatorias en todo momento. No hay excepciones.
Aplica para todo agente de IA (Hermes, Copilot, Codex, etc.) que trabaje en este proyecto.

---

## Reglas de arquitectura

### Provider Registry — regla más importante
- NINGÚN archivo fuera de `src/agents/provider-registry.ts` puede importar directamente de `@ai-sdk/anthropic`, `@ai-sdk/openai` ni `@ai-sdk/google`
- Todos los agentes reciben una instancia de `AgentProvider` — nunca saben qué LLM hay detrás
- Si necesitás usar un LLM en cualquier lugar, pasá el provider como parámetro

### TypeScript
- `strict: true` siempre. Sin `any`, sin `as unknown`, sin `@ts-ignore`
- Todos los outputs de agentes se validan con zod antes de persistir
- Los modelos de datos viven en `src/types/` — nunca los dupliques inline

### Supabase y multi-tenancy
- Toda query filtra por `agency_id` explícitamente — no confíes solo en RLS
- RLS activado en todas las tablas como segunda línea de defensa
- Nunca uses `supabase.from()` sin `.eq('agency_id', agencyId)`
- Las API keys de LLM son server-side únicamente — nunca en el cliente

### Human in the loop
- Ningún output de agente se persiste con status `'approved'` automáticamente
- El flujo es siempre: agente genera → usuario revisa/edita → usuario aprueba → se persiste
- El siguiente agente del pipeline SOLO puede correr si el anterior tiene status `'approved'`

---

## Reglas de desarrollo

### Un agente a la vez
- No empieces el siguiente agente hasta que el anterior funcione end-to-end
- End-to-end significa: formulario → agente → output editable → guardado en Supabase

### Streaming obligatorio
- Todos los agentes exponen sus outputs con streaming via Vercel AI SDK
- Usa `streamText` en el API route y `useCompletion` en el cliente

### Tokens y costos
- Nunca hagas llamadas al LLM para tareas que se pueden resolver con lógica normal
- Si algo se puede calcular (distribución de fechas, conteo de piezas), hacelo en código
- Los prompts de sistema deben estar en archivos separados `src/agents/prompts/*.ts`, no inline

### Orden de implementación obligatorio
1. Tipos (`src/types/`)
2. Provider Registry (`src/agents/provider-registry.ts`)
3. Supabase schema + cliente
4. Agente + API route
5. UI del agente

Nunca saltes al paso 5 sin tener el 1-4 funcionando.

---

## Mantenimiento

Cuando se agregue, cambie o se descubra una nueva regla que afecte el desarrollo futuro, actualizar ESTE archivo y `CLAUDE.md` en paralelo para que siempre estén sincronizados.
<!-- END:agentcy-rules -->

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
