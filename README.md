# AI Key Guard

A professional dashboard for validating and stress-testing AI provider API keys — built with Next.js 15, React 19, and Framer Motion.

All validation runs **server-side** via Next.js Server Actions, so your API keys are never exposed in the browser or subject to CORS restrictions.

---

## Features

- **Key Validator** — paste a key, hit Enter or click Run Diagnostic; get instant status, model list, and error details
- **Audit Log** — every check is stored in `localStorage` with timestamp, provider, masked key, and result; export to JSON or delete individually
- **Model Stress Tester** — fetch all models for a key, select a subset, run sequential latency tests and see per-model response times
- **Full History View** — filterable and searchable log across providers and statuses
- **15-second fetch timeout** — no hanging requests; clear timeout error messages
- **Privacy-first** — nothing leaves your browser except the validation request itself

## Supported Providers

| Provider | Auth method |
|---|---|
| OpenAI | `Authorization: Bearer` |
| Anthropic | `x-api-key` header |
| Google Gemini | `?key=` query param |
| Groq | `Authorization: Bearer` |
| Mistral AI | `Authorization: Bearer` |
| Perplexity | `Authorization: Bearer` |
| OpenRouter | `Authorization: Bearer` |
| DeepSeek | `Authorization: Bearer` |
| Together AI | `Authorization: Bearer` |

## Pages

| Route | Purpose |
|---|---|
| `/` | Check a key, real-time audit log |
| `/history` | Full filterable history |
| `/tester` | Fetch models, select subset, run latency tests |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # Production build
npm run lint    # ESLint
```

## Tech Stack

- [Next.js 15](https://nextjs.org) — App Router, Server Actions, React Compiler
- [React 19](https://react.dev)
- [Framer Motion](https://www.framer.com/motion/) — animations
- [Lucide React](https://lucide.dev) — icons
- TypeScript throughout; no Tailwind (custom CSS with dark theme variables)

## Project Structure

```
app/
  page.tsx          # Key checker + audit log
  history/page.tsx  # Full history with filters
  tester/page.tsx   # Model stress tester
  globals.css       # Dark theme, CSS variables
components/
  Navigation.tsx    # Sticky top nav
lib/
  api-checker.ts    # Core: PROVIDERS, checkApiKey(), testModel()
  actions.ts        # Next.js Server Actions (CORS boundary)
```

## License

MIT © Sai Rama Linga Reddy Maruri
