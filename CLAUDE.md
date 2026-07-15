# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run build` — `rimraf ./dist && tsc && npm run plugin-ui`. The `plugin-ui` step rsyncs `src/homebridge-ui/public/index.html` into `dist/` (the UI server itself is TypeScript and compiled by `tsc`). Skipping it produces a broken published package.
- `npm run lint` — ESLint over the whole repo with `--max-warnings=0`. CI fails on any warning. `npm run lint:fix` to autofix.
- `npm test` — vitest, colocated `src/**/*.test.ts` files. `npm run test:watch` and `npm run test-coverage` also available.
- `npm run watch` — build, `npm link`, then `nodemon`: recompiles and restarts `homebridge -U ./test/hbConfig -D` on `src/**/*.ts` changes. `./test/hbConfig` is gitignored; create it locally.
- `npm run docs` — typedoc into `docs/` (gitignored — generated output is never committed).
- `npm run prepublishOnly` — lint then build; runs automatically on publish.

CI (`.github/workflows/build.yml`) runs install + lint on Node 22.x/24.x. Releases publish via `.github/workflows/release.yml`: a GitHub release (tag `vX.Y.Z`) publishes to npm's `latest` tag; pushes to `beta-X.Y.Z` / `alpha-X.Y.Z` branches publish incrementing prerelease versions to the `beta` / `alpha` tags.

Supported Node: `^22.12.0 || ^24.0.0`. Homebridge: `^2.0.0`.

## Architecture

Homebridge dynamic platform plugin (`platform: "Resideo"`, package `@homebridge-plugins/homebridge-resideo`) bridging Resideo (Honeywell Home) thermostats, room sensors, leak sensors and shutoff valves into HomeKit via the Honeywell cloud API.

### Authentication (`src/Platform.HAP.ts` + `src/homebridge-ui/`)

OAuth2 against `api.honeywell.com` using the user's own developer-portal app (consumer key/secret). The custom plugin UI handles the initial account-link flow (authorize → callback → tokens written to config). At runtime the platform refreshes the access token (`refreshAccessToken`) before polling. HTTP goes through `src/http-client.ts` (`NativeHttpClient`, native Node http/https — no undici).

### HAP/Matter platform selection

`src/index.ts` registers a runtime proxy that picks `ResideoMatterPlatform` (`src/Platform.Matter.ts`, extends the HAP platform) when Homebridge reports Matter available+enabled (config-gated), otherwise `ResideoPlatform` (`src/Platform.HAP.ts`). Matter API calls must stay optional-chained.

### Device discovery and classes (`src/devices/`)

Discovery walks `/v2/locations` then `/v2/devices` per location. The `deviceClass` switch creates the matching device class, each extending `deviceBase` (`src/devices/device.ts`) and stored on the accessory as `accessory.control` (module augmentation in `device.ts`):
- `Thermostats` (`thermostats.ts`) — T-series/Round/TCC thermostats
- `RoomSensors` / `RoomSensorThermostat` (`roomsensors.ts`, `roomsensorthermostats.ts`) — T9 room sensors, grouped via `T9groups`
- `LeakSensor` (`leaksensors.ts`) — WiFi leak & freeze detectors
- `Valve` (`valve.ts`) — `ShutoffValve` device class

Devices can be published as external accessories via per-device `external` config — never pass external accessories to `api.updatePlatformAccessories`.

### Logging

Leveled log helpers (`infoLog`, `warnLog`, `errorLog`, `debugLog`, …) gated by `config.options.logging` with per-device overrides. Use these instead of `this.log` directly.

## Conventions

- TypeScript ESM (`"type": "module"`): relative imports use `.js` extensions even from `.ts` source.
- ESLint is `@antfu/eslint-config` (flat config in `eslint.config.js`): single quotes, 1tbs braces, `curly` multi-line only, sorted exports. Run `npm run lint:fix` before committing.
- `config.schema.json` defines the Homebridge UI form and must stay in sync with the interfaces in `src/settings.ts` (`ResideoPlatformConfig`, `devicesConfig`, `options`).
- Copyright headers in `src/` credit @donavanbecker, the original plugin author — leave them in place.
