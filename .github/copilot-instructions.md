# Copilot instructions

Guidance for AI coding agents working in this repository. The fuller version of this document is [CLAUDE.md](../CLAUDE.md) at the repo root — keep the two in sync.

## Commands

- Build: `npm run build` (`rimraf ./dist` → `tsc` → copy plugin UI html). All steps are required for a working package.
- Lint: `npm run lint` (`eslint . --max-warnings=0`, CI fails on warnings); `npm run lint:fix` to autofix.
- Test: `npm test` (vitest, colocated `src/**/*.test.ts`).
- Local dev loop: `npm run watch` (rebuild + restart `homebridge -U ./test/hbConfig -D` on changes; `./test/hbConfig` is gitignored, create locally).

## Key architecture facts

- Homebridge dynamic platform plugin bridging Resideo (Honeywell Home) devices into HomeKit via the Honeywell cloud API.
- OAuth2 with the user's own developer-portal app; the custom plugin UI handles account linking; the platform refreshes tokens at runtime (`refreshAccessToken`).
- HTTP goes through `src/http-client.ts` (`NativeHttpClient`, native Node http/https — no undici).
- `src/index.ts` registers a runtime HAP/Matter proxy; keep `api.matter?.…` calls optional-chained.
- Device classes in `src/devices/` extend `deviceBase` and are stored as `accessory.control`: `Thermostats`, `RoomSensors`/`RoomSensorThermostat` (T9 groups), `LeakSensor`, `Valve` (`ShutoffValve`).
- Devices can be published as external accessories (per-device `external` config) — never pass external accessories to `api.updatePlatformAccessories`.
- Use the platform's leveled log helpers (`infoLog`, `debugLog`, …) so user logging settings are respected.

## Conventions

- TypeScript ESM: relative imports need `.js` extensions.
- ESLint `@antfu/eslint-config`: single quotes, sorted exports; run `npm run lint:fix` before committing.
- `config.schema.json` must stay in sync with the config interfaces in `src/settings.ts`.
- Copyright headers in `src/` credit @donavanbecker (original author) — leave them in place.
