# CLAUDE.md — Awake Agentic SaaS

Estas reglas son obligatorias en todo momento. No hay excepciones.

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
