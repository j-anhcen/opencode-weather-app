# AGENTS.md

Weather CLI implemented with a Spanish interface. `src/index.ts` is the entrypoint (loads config and starts the menu); the rest of the code is organized by layer under `src/`: `actions/` (menu flows), `presentation/` (menu, output, input), `storage/` (cities and settings persistence), `api/` (OpenMeteo and geocoding), `types/` (shared contracts), and `utils/` (formatting, constants, colors). `README.md` (Spanish) is the product spec — menu options, desired behavior, and the OpenMeteo request flow.

## Toolchain

- Bun only (1.4.x verified). Use `bun` instead of `node`/`npm`/`pnpm`, and `bunx` instead of `npx`. `bun-instructions.md` lists the project's Bun preferences (Bun APIs over Express/dotenv/etc.).
- `bun install` is the only package manager; keep `bun.lock` as the sole lockfile.
- Typecheck: `bun check` (same as `bun run typecheck`). One file: `bun check src/index.ts`.
- `tsconfig.json` sets `strict` and `noUncheckedIndexedAccess`, so array/record reads are `T | undefined` — handle the undefined case rather than asserting.
- Tests: `bun test` (o `bun run test`), archivos en `tests/` con sufijo `*.test.ts`. `bunfig.toml` precarga `tests/setup.ts`, que mockea `node:readline`; por eso los tests manejan la entrada con `tests/helpers/readlineMock.ts`. Cobertura: `bun run test:coverage`.
- No linter, formatter, or pre-commit hooks are configured; the only CI is the release workflow (see "Run and ship").

## Run and ship

- Run: `bun src/index.ts`
- The README's deliverable is a standalone executable: `bun run build`, que ejecuta `bun test` antes de `bun build --compile ./src/index.ts --outfile weather` y no compila si algún test falla. `out/`, `dist/`, and the binary artifacts are gitignored.
- Release CI: `.github/workflows/release.yml` se ejecuta en cada push a `main` que toque `package.json` (y manualmente con `workflow_dispatch`). Lee `version` de `package.json` y, si todavía no existe el release `v<version>`, corre `bun run build` en Linux x64 (`ubuntu-latest`), macOS arm64 (`macos-latest`) y Windows x64 (`windows-latest`), y publica los binarios como assets del tag: `weather-linux-x64`, `weather-macos-arm64`, `weather-windows-x64.exe`. Para cortar un release basta con subir `version` en `package.json` y hacer push a `main`.

## Repo-specific conventions

- User-facing output and the menu are in Spanish; take exact labels/option numbers from `README.md`.
- Weather lookups start with geocoding (`https://geocoding-api.open-meteo.com/v1/search?name=<city>&count=1&language=es&format=json`) to get latitude/longitude, then use the forecast API (`https://api.open-meteo.com/v1/forecast?latitude=<lat>&longitude=<lon>`): `current=...` for current weather and `daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto` for the 7-day forecast. No API key.
- Config persists to `~/.config/weather-cli/config.json` (override the path with the `WEATHER_CLI_CONFIG` env var); it stores the default city, the saved cities, and the temperature unit.
- `src/index.ts` is the entrypoint (per `package.json` `module`); no application code lives at the repo root. There is no build step beyond `bun build --compile`.
- Imports use explicit `.ts` extensions and `import type` for types (`verbatimModuleSyntax` is enabled).
- Layer direction: `actions/` orchestrates `api/`, `storage/`, `presentation/`, and `utils/`; `presentation/menu.ts` wires the actions into menu options; `presentation/output.ts` and `presentation/input.ts` never import actions. Keep the graph acyclic.
- Use `@bun-instructions.md` to get instructions about bun.
