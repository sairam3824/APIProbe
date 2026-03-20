# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

**AI Key Guard** — a Next.js 15 App Router app for validating and testing AI provider API keys. All styling is in [app/globals.css](app/globals.css) (dark theme, CSS variables, no Tailwind).

### Key files

- [lib/api-checker.ts](lib/api-checker.ts) — Core logic: `PROVIDERS` array, `checkApiKey()` (validates a key by hitting the provider's `/models` endpoint), `testModel()` (sends a minimal chat request to measure latency), `maskKey()`, `getISTTimestamp()`.
- [lib/actions.ts](lib/actions.ts) — Next.js Server Actions (`"use server"`) that wrap the functions above. These are the only entry points called from the client to avoid CORS issues.
- [components/Navigation.tsx](components/Navigation.tsx) — Top nav with hydration-safe active link highlighting.

### Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | [app/page.tsx](app/page.tsx) | Check a key, view real-time audit log, re-check/copy/export/clear history |
| `/history` | [app/history/page.tsx](app/history/page.tsx) | Filterable/searchable view of full localStorage history |
| `/tester` | [app/tester/page.tsx](app/tester/page.tsx) | Fetch all models for a key, select a subset, run sequential latency tests |

### Data flow

1. User pastes key + selects provider in the browser.
2. Client calls a Server Action in `lib/actions.ts`.
3. Server Action calls `lib/api-checker.ts` which makes a `fetch()` to the provider API (runs server-side, avoiding CORS).
4. Result returned to client; stored in React state and persisted to `localStorage` (`api_key_history`).

### Supported providers

OpenAI, Anthropic, Google Gemini, Groq, Mistral AI, Perplexity, OpenRouter, DeepSeek, Together AI. Each uses a Bearer token except Anthropic (`x-api-key` header) and Google (query param `key=`).

### Tech

- Next.js 15 with React Compiler (`reactCompiler: true`)
- Framer Motion for animations
- Lucide React for icons
- TypeScript throughout
