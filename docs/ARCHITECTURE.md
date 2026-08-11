# Creative Frontend Engine — Architecture

## Current architecture (Milestone 01)

Milestone 01 is a Next.js App Router foundation with no AI runtime, no persistence, and no pipeline execution.

```
creative-agent/
├── app/                 # Next.js App Router routes and layouts
├── components/          # UI components (presentation)
├── lib/
│   ├── ai/              # Future AI provider abstraction
│   ├── agents/          # Future specialized agents
│   └── schemas/         # Future Zod schemas for structured outputs
├── public/              # Static assets
├── projects/            # Future project data / artifacts (filesystem or later storage)
└── docs/                # Project documentation
```

**Stack today**

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Validation | Zod (dependency present; schemas added in later milestones) |
| Lint | ESLint |

The home route (`/`) is a minimal dashboard shell. Project creation UI exists as an entry point only; it does not create or persist projects yet.

## Planned agent architecture

Later milestones will add small, specialized agents rather than one giant prompt. Expected roles (subject to change per milestone):

| Agent | Responsibility |
|-------|----------------|
| Product Understanding | Extract product intent, audience, constraints |
| Reference Analysis | Derive visual principles from references (not copies) |
| Creative Brief / Design Genome | Consolidate a structured brief |
| Direction Generator | Produce a small set of distinct creative directions |
| Implementation | Translate a selected direction into frontend code |
| Visual Critique | Evaluate rendered UI against the brief and direction |

Each agent should have a narrow input/output contract. Orchestration lives outside any single prompt.

## AI provider abstraction

All model calls will go through `lib/ai/`. Application and agent code must not import vendor SDKs directly.

Goals:

- Swap providers (e.g. OpenAI, Anthropic, Google) without rewriting agents
- Keep API keys server-side only
- Centralize retries, logging, and model selection later if needed

Milestone 01 does not implement providers; only the folder and `.env.example` placeholders exist.

## Structured outputs with Zod

Agent and AI responses that drive product logic must be validated with Zod schemas in `lib/schemas/`.

- Define schemas next to the contracts they enforce
- Parse/validate on the server before use
- Fail closed on invalid shapes rather than trusting free-form text

## Project data flow (planned)

```
User / project input
    → app (routes, server actions / API routes)
    → agents (specialized steps)
    → lib/ai (provider calls)
    → Zod validation (lib/schemas)
    → projects/ (or later storage) as structured artifacts
    → components / app (presentation of results)
```

**Separation rules**

- Product and agent logic stay in `lib/` (and server routes), not in React components
- Components render state and collect input; they do not call providers
- Pipeline artifacts should be explicit files or records, not buried in chat transcripts

Milestone 01 has no end-to-end data flow yet beyond serving the dashboard UI.
