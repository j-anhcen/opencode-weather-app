# AGENTS.md

Weather CLI implemented with a Spanish interface. `index.ts` is the entrypoint (menu loop and option handlers); the rest of the modules live in `src/`: `ui.ts` (menu, cards, prompts), `weather.ts` (OpenMeteo client), `storage.ts` (config persistence). `README.md` (Spanish) is the product spec — menu options, desired behavior, and the OpenMeteo request flow.

## Toolchain

- Bun only (1.4.x verified). Use `bun` instead of `node`/`npm`/`pnpm`, and `bunx` instead of `npx`. `bun-instructions.md` lists the project's Bun preferences (Bun APIs over Express/dotenv/etc.).
- `bun install` is the only package manager; keep `bun.lock` as the sole lockfile.
- Typecheck: `bun check` (same as `bun run typecheck`). One file: `bun check index.ts`.
- `tsconfig.json` sets `strict` and `noUncheckedIndexedAccess`, so array/record reads are `T | undefined` — handle the undefined case rather than asserting.
- Tests: `bun test`, files must match `*.test.ts` / `*.spec.ts`. None exist yet, so `bun test` currently errors with "0 test files matching".
- No linter, formatter, pre-commit hooks, or CI are configured.

## Run and ship

- Run: `bun index.ts`
- The README's deliverable is a standalone executable: `bun build --compile ./index.ts --outfile weather` (verified). `out/`, `dist/`, and the binary artifacts are gitignored.

## Repo-specific conventions

- User-facing output and the menu are in Spanish; take exact labels/option numbers from `README.md`.
- Weather lookups are two requests: geocoding (`https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1&language=es&format=json`) to get latitude/longitude, then forecast (`https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>&current=temperature_2m`). No API key.
- Config persists to `~/.config/weather-cli/config.json` (override the path with the `WEATHER_CLI_CONFIG` env var); it stores the default city, the saved cities, and the temperature unit.
- `index.ts` at the repo root is the entrypoint (per `package.json` `module`); all other modules live in `src/`. There is no build step beyond `bun build --compile`.
- Use `@bun-instructions.md` to get instructions about bun.
