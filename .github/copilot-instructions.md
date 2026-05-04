# Homebridge Resideo Plugin

Always reference these instructions first and fall back to search only when the repo contents do not answer the question.

This is a Homebridge platform plugin for Resideo and Honeywell Home devices. The plugin is written in TypeScript, talks to the Resideo cloud API over OAuth, and exposes supported devices to HomeKit through Homebridge.

Current focus: keep the HAP integration stable, keep the Homebridge UI account-linking flow working, and preserve existing thermostat, room sensor, leak sensor, and shutoff valve behavior.

## Device Support

### Currently Supported Devices
- Thermostats with HomeKit exposure through the main accessory flow
- T9 and T10 room sensors exposed as separate accessories when enabled
- T9 and T10 room-priority virtual thermostat accessories when configured
- Leak detectors
- Shutoff valves

### Device Classes Seen In Code
- `Thermostat`
- `LeakDetector`
- `ShutoffValve`

### Important Notes
- This repository is currently HAP-only. There is no Matter platform implementation in this codebase.
- Room sensors are discovered from thermostat group data, not as top-level standalone devices.
- Unsupported devices are logged from `src/platform.ts` and should be added through the platform discovery switch plus a dedicated device class.

## Homebridge and API Integration

### Platform Model
- The plugin registers a single dynamic platform through `ResideoPlatform` in `src/platform.ts`.
- `src/index.ts` only registers the platform and contains no business logic.
- Device discovery happens after `didFinishLaunching`, once an access token is refreshed.

### OAuth Flow
- The Homebridge UI custom server in `src/homebridge-ui/server.ts` starts a temporary local HTTP server on port `8585`.
- The UI redirects the user to the Resideo authorize endpoint, receives the authorization code, and exchanges it for tokens.
- The platform refreshes the access token at runtime and writes back a new refresh token into Homebridge `config.json` when it changes.

### Authoritative References
- Resideo developer setup in `README.md`
- OAuth and API endpoints in `src/settings.ts`
- Homebridge schema and UI behavior in `config.schema.json` and `src/homebridge-ui/server.ts`

## Changelog Format Requirements

When generating a changelog entry for this repository, always use the homebridge-resideo compare URLs, not another plugin's URLs.

Use this release header format:

```md
## [X.Y.Z](https://github.com/homebridge-plugins/homebridge-resideo/compare/vX.Y.(Z-1)...vX.Y.Z) (YYYY-MM-DD)
```

Use standard sections as needed, such as `### Bug Fixes`, `### Enhancements`, or `### Documentation`.

End each release entry with:

```md
**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/vX.Y.(Z-1)...vX.Y.Z
```

If the previous version is not known, inspect `CHANGELOG.md` before drafting the entry.

## Working Effectively

### Bootstrap and Build
- Install dependencies: `npm install`
- Build the project: `npm run build`
- Clean build artifacts: `npm run clean`
- Copy the Homebridge UI file into `dist`: `npm run plugin-ui`
- Full publish pipeline: `npm run prepublishOnly`

### Testing and Quality Assurance
- Lint code: `npm run lint`
- Fix lint issues: `npm run lint:fix`
- Package `test` currently aliases lint: `npm run test` runs `npm run lint`
- Vitest is installed and test files exist under `src/`, but there is no dedicated `package.json` script for them right now
- Generate docs: `npm run docs`
- Validate docs: `npm run lint-docs`

### Development Workflow
- Development mode: `npm run watch`
- `npm run watch` builds, copies the UI file, links the plugin locally, and starts `nodemon`
- The Homebridge UI is backed by a single static file at `src/homebridge-ui/public/index.html`
- Always run `npm run build` after source changes
- Always run `npm run lint` before finishing a code change

## Validation

After making code changes, validate with:
1. `npm run build`
2. `npm run lint`
3. `npm run test`

If you changed generated-doc comments or documentation-sensitive types, also run:
4. `npm run docs`
5. `npm run lint-docs`

If you changed the UI login flow, also validate the Homebridge UI account-linking path.

## Important Directories and Files

### Source Code Structure
- `src/index.ts` - Homebridge entry point
- `src/platform.ts` - Main platform, OAuth refresh, discovery, accessory registration, retry and logging behavior
- `src/settings.ts` - Plugin constants, config types, API URLs, and device-related TypeScript interfaces
- `src/utils.ts` - Utility helpers such as temperature conversion
- `src/devices/thermostats.ts` - Thermostat accessory implementation
- `src/devices/roomsensors.ts` - Room sensor accessory implementation
- `src/devices/roomsensorthermostats.ts` - Virtual thermostat accessory for room-priority flows
- `src/devices/leaksensors.ts` - Leak sensor accessory implementation
- `src/devices/valve.ts` - Shutoff valve accessory implementation
- `src/homebridge-ui/server.ts` - Custom Homebridge UI backend server for OAuth login
- `src/homebridge-ui/public/index.html` - Custom Homebridge UI frontend

### Tests
- `src/index.test.ts`
- `src/platform.test.ts`
- `src/settings.test.ts`
- `src/utils.test.ts`

### Configuration and Build
- `package.json`
- `config.schema.json`
- `eslint.config.js`
- `tsconfig.json`
- `typedoc.json`
- `nodemon.json`
- `.github/copilot-instructions.md`

### Generated Output
- `dist/`
- `docs/`

## Dependencies and Requirements

### Runtime Requirements
- Node.js `^20 || ^22`
- Homebridge `^1.9.0 || ^2.0.0 || ^2.0.0-beta.26 || ^2.0.0-alpha.37`

### Key Runtime Dependencies
- `axios` for Resideo API requests
- `rxjs` for reactive flows used by device code
- `@homebridge/plugin-ui-utils` for the Homebridge settings UI server

### Key Development Dependencies
- `typescript`
- `eslint`
- `@antfu/eslint-config`
- `typedoc`
- `vitest`
- `nodemon`

## Common Development Tasks

### Adding New Device Support
1. Add the device class handling in the discovery switch in `src/platform.ts`.
2. Create a new implementation under `src/devices/` following the existing accessory classes.
3. Update `config.schema.json` if the new device requires user-configurable options.
4. Add or update TypeScript types in `src/settings.ts`.
5. Make sure cached accessories use a stable UUID pattern.
6. Validate with `npm run build`, `npm run lint`, and `npm run test`.

### Changing Thermostat or Sensor Behavior
1. Start in `src/platform.ts` to find the controlling discovery and refresh path.
2. Move into the owning class in `src/devices/thermostats.ts`, `src/devices/roomsensors.ts`, or `src/devices/roomsensorthermostats.ts`.
3. Keep room sensor logic aligned with the thermostat group APIs used by `getCurrentSensorData()`.
4. Preserve per-device config overrides from `options.devices`.

### Changing the OAuth or UI Flow
1. Update the frontend in `src/homebridge-ui/public/index.html`.
2. Update the backend server in `src/homebridge-ui/server.ts`.
3. Keep the callback path and port handling aligned with the README and schema.
4. Rebuild so the UI file is copied to `dist`.

## Common Issues and Solutions

### Build Failures
- Verify dependencies are installed with `npm install`.
- Rebuild from clean state with `npm run clean && npm run build`.
- Remember this project is ESM and local imports use `.js` extensions.

### Test Confusion
- `npm run test` is not a separate unit-test command in this repo; it currently runs lint.
- If you need to execute Vitest directly, use the local toolchain already present in the repo rather than inventing a new workflow.

### OAuth and Login Failures
- Re-check the Resideo developer app callback URL and credentials.
- Confirm the temporary local server can bind to port `8585`.
- If token refresh fails, inspect the stored credentials in Homebridge config and the refresh-token update path in `src/platform.ts`.

### Device Discovery Gaps
- Discovery is location-based through the Resideo API.
- Room sensors depend on thermostat groups and will not appear unless the thermostat and group data support them.
- Unsupported `deviceClass` values require new platform handling and a dedicated accessory implementation.

Never describe this repository as a Lutron plugin, never mention Matter support as if it exists today, and never reference files such as `Platform.Matter.ts`, `WallDimmer.ts`, `PicoRemote.ts`, or other artifacts that are not present in this workspace.

## Matter and HomeKit Integration

### Matter Implementation
The plugin implements dual-mode device registration:
- **HAP mode** (HomeKit Accessory Protocol): Base implementation via `LutronCasetaLeap` class
- **Matter mode**: Extended via `LutronCasetaLeapMatterPlatform` class that overrides `processDevice()`

When Homebridge's Matter API is available, `LutronCasetaLeapMatterPlatform.processDevice()` registers accessories with both HAP and Matter simultaneously. If Matter API is not available, the plugin transparently falls back to HAP-only mode.

### Matter Device Type Mapping
All Matter device types use `api.matter.deviceTypes.*` objects from the homebridge-matter API:

| Device Type | HAP Service | Matter DeviceType | Matter Clusters |
|---|---|---|---|
| WallDimmer | Lightbulb | `DimmableLight` | onOff, levelControl |
| WallSwitch | Switch | `OnOffLight` | onOff |
| SerenaTiltOnlyWoodBlind | WindowCovering | `WindowCovering` | windowCovering |
| RPSOccupancySensor | OccupancySensor | `OccupancySensor` | occupancySensing |
| Pico Remotes | StatelessProgrammableSwitch | `GenericSwitch` | switch |

### Authoritative Matter References

1. https://matter-js.github.io/docs/index.html
2. https://github.com/homebridge-plugins/homebridge-matter: Official Homebridge Matter plugin repository with extensive documentation and examples
  - For all Matter cluster, attribute, and device type specifications, use the official homebridge-matter wiki:
    - [Introduction](https://github.com/homebridge-plugins/homebridge-matter/wiki/Introduction)
    - [Core Concepts](https://github.com/homebridge-plugins/homebridge-matter/wiki/Core-Concepts)
    - [Getting Started](https://github.com/homebridge-plugins/homebridge-matter/wiki/Getting-Started)
    - [State Management](https://github.com/homebridge-plugins/homebridge-matter/wiki/State-Management)
    - [Monitoring External Changes](https://github.com/homebridge-plugins/homebridge-matter/wiki/Monitoring-External-Changes)
    - [Best Practices](https://github.com/homebridge-plugins/homebridge-matter/wiki/Best-Practices)
    - [Advanced Patterns](https://github.com/homebridge-plugins/homebridge-matter/wiki/Advanced-Patterns)
    - [API Reference](https://github.com/homebridge-plugins/homebridge-matter/wiki/API-Reference)
    - [Matter Types](https://github.com/homebridge-plugins/homebridge-matter/wiki/Matter-Types)
    - [Value Conversions](https://github.com/homebridge-plugins/homebridge-matter/wiki/Value-Conversions)

  - **Device References:**
    - [Lighting Devices (§4)](https://github.com/homebridge-plugins/homebridge-matter/wiki/Section-4-Lighting) — DimmableLight, OnOffLight
    - [Switches (§6)](https://github.com/homebridge-plugins/homebridge-matter/wiki/Section-6-Switches) — OnOffSwitch
    - [Sensors (§7)](https://github.com/homebridge-plugins/homebridge-matter/wiki/Section-7-Sensors) — OccupancySensor
    - [Closure Devices (§8)](https://github.com/homebridge-plugins/homebridge-matter/wiki/Section-8-Closure) — WindowCovering

## Changelog Format Requirements

When generating a changelog release entry, always use this exact structure:

1. Release header with compare URL using `compare/tag/vX.Y.Z`:

```md
## [X.Y.Z](https://github.com/homebridge-plugins/homebridge-updater/compare/tag/vX.Y.Z) (YYYY-MM-DD)
```

2. Standard sections as needed (`### Bug Fixes`, `### Enhancements`, `### Documentation`, etc.).

3. End each release entry with a full changelog comparison URL to the previous version:

```md
**Full Changelog**: https://github.com/homebridge-plugins/homebridge-updater/compare/vX.Y.(Z-1)...vX.Y.Z
```

Do not omit either URL line when creating a new release entry.