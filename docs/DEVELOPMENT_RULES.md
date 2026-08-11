# Creative Frontend Engine — Development Rules

1. **Do not over-engineer.** Prefer the simplest structure that satisfies the current milestone.

2. **Implement one milestone at a time.** Finish and verify the current milestone before starting the next.

3. **Do not add dependencies without a reason.** Every new package must support a concrete, current need.

4. **Keep AI providers behind an abstraction.** Agents and app code must not call vendor SDKs directly.

5. **Validate AI structured outputs with Zod.** Do not trust unvalidated model JSON.

6. **Never expose API keys to the client.** Keys stay in server-only environment variables.

7. **Keep product logic separate from presentation.** Business and agent logic belongs in `lib/` and server routes; components render and collect input.

8. **Do not let a single giant AI prompt control the entire application.** Split work into clear steps with explicit contracts.

9. **Prefer small specialized agents.** Narrow responsibilities beat monolithic “do everything” agents.

10. **Every milestone must be runnable.** Lint and build (and any milestone-specific checks) must pass before the milestone is considered done.

11. **Do not modify unrelated files.** Change only what the task requires.

12. **Do not implement future milestones unless explicitly requested.** No speculative features, integrations, or pipeline steps ahead of schedule.
