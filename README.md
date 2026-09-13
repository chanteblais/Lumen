# Coherence

An AI companion for task initiation, momentum, re-entry and body doubling. Not a task manager.

- What it is becoming: [`PROJECT-CANON.md`](PROJECT-CANON.md). Every doc and what's in it: [`docs/README.md`](docs/README.md).
- How to work here: [`CLAUDE.md`](CLAUDE.md), [`docs/branching.md`](docs/branching.md), [`docs/dev-hygiene.md`](docs/dev-hygiene.md).

```bash
nvm use                       # Node 22 (.nvmrc)
npm ci                        # exactly package-lock.json
cp .env.example .env.local    # then fill in the keys it lists
npm run dev -- -p 3005        # preflight, then next dev
npm run check                 # preflight, then typegen + tsc, eslint, vitest, route-auth audit, CSS prefix audit, Lumi's brief check
```
