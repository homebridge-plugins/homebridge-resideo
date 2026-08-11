## v3.2.2 (Pending Release)

### Changed

- fix: keep debug warnings, errors and successes out of the log unless debug is on

## v3.2.1 (2026-08-09)

### Changed

- chore: keep test files out of the published package
- chore(github): run the build and tests in ci, on node 22, 24 and 26
- chore: use the same lint setup across every plugin
- chore: add a changelog:sync script to populate the pending section from the commits
- chore: count a repeated commit subject once when syncing the changelog
- chore(github): check the changelog against the commits in ci
- chore(deps): dependency updates
- chore: restore the original author and remove personal funding links
- docs: add node 26 to the supported node versions
- chore: allow dependency install scripts by package name rather than pinned version, so a version bump cannot silently block a native build
- chore: exclude test files and the test config from the published package
- fix: restore debug logging when the plugin runs in a child bridge
- fix: make room priority work on room sensor thermostats
- fix: keep showing device messages when the logging level is set to standard
- fix: send the room sensor's humidity to homekit, so the tile updates
- fix: actually remove a service when its hide setting is turned on
- fix: show the real firmware version on a t9 or t10, not the plugin's own version
- fix: make the retry, stateful switch and valve type settings do what they say
- fix: recover from a connection dropped mid-response instead of crashing the bridge
- fix: stop the token refresh and device polling when homebridge shuts down
- fix: stop writing the access token into the debug log
- fix: log the error message rather than the whole error object, which can carry the api response
- fix: stop confirming updateRate in the log, when nothing reads it
- fix: clamp the poll and retry delays, so a very large setting cannot make them fire every millisecond

## v3.2.0 (2026-07-27)

### Changed

- chore(github): use the shared homebridge action to deprecate past pre-releases
- feat(ui): add, remove and hide devices from the config via the devices tab
- style(ui): standardise the custom ui layout and sync the support tab with the readme
- feat(ui): add a remove all devices action to the my devices tab
- fix(schema): declare required fields the standard way so the homebridge ui stops reporting a config validation failure
- chore: declare the supports-hap transport keyword for the homebridge ui
- chore(deps): dependency updates
- docs(changelog): list every unreleased commit in the pending section

## v3.1.5 (2026-07-24)

### Changed

- fix(ui): spell out that the sign-in window wants the resideo app account, not the developer account (#930) (@dash16)

## v3.1.4 (2026-07-20)

### Changed

- fix(ui): use the working resideo api host for login, so the setup flow stops failing on an expired certificate (#927) (@cowboydaks) (@carlosfranceschi)
- fix(ui): exchange the login code with fetch instead of shelling out to curl

## v3.1.3 (2026-07-20)

### Changed

- fix(schema): give the logging levels clear, distinct names
- chore(deps): dependency updates

## v3.1.2 (2026-07-18)

### Changed

- chore(github): update the setup-node action to v7
- fix: report the water shutoff valve state from the valve rather than its online status (#785) (@bsteinbach112)
- chore(deps): dependency updates

## v3.1.1 (2026-07-15)

### Changed

- fix: use the updated honeywell api endpoints (#924) (@wesleydeland)
- chore(deps): update dependencies
- chore: add .idea to .gitignore
- chore(github): align workflows, funding and issue templates with the other org plugins
- chore: align npm publishing files with the other org plugins
- chore: standardise the eslint setup with the other org plugins
- refactor: store device instances on their accessories like the other org plugins
- style: apply the standardised lint rules
- chore: standardise the package scripts and publishing config
- chore: update the plugin metadata for the new maintainer
- chore: sync the package version with the released v3.1.0
- docs: refresh the readme
- docs: add claude and copilot instructions files
- docs: use the standard org readme banner
- fix: keep matter display names within the 32 character limit

## [3.1.0](https://github.com/homebridge-plugins/homebridge-resideo/compare/v3.0.2...v3.1.0) (2026-05-04)

### Enhancements
- Added fan mode mapping configuration for simplified HomeKit fan control and Siri-friendly fan behavior in thermostats ([#880](https://github.com/homebridge-plugins/homebridge-resideo/pull/880)).
- Added a `convertUnits` configuration option to override temperature unit conversion when the Resideo API reports mismatched units ([#881](https://github.com/homebridge-plugins/homebridge-resideo/pull/881)).
- Enabled switching the thermostat fan between `Auto` and `On` while HomeKit fan target state remains `AUTO` ([#886](https://github.com/homebridge-plugins/homebridge-resideo/pull/886)).

### Bug Fixes
- Fixed current temperature conversion so Fahrenheit readings from the Resideo API are converted correctly when HomeKit is using Celsius ([#882](https://github.com/homebridge-plugins/homebridge-resideo/pull/882)).

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v3.0.2...v3.1.0

## [3.0.2](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v3.0.2) (2025-03-04)

# *No New Releases During Lent*

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v3.0.1...v3.0.2

## [3.0.1](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v3.0.1) (2025-01-25)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v3.0.0...v3.0.1

## [3.0.0](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v3.0.0) (2025-01-16)

### What's Changes
- This plugins has moved to a scoped plugin under the `@homebridge-plugins` org.
  - Homebridge UI is designed to transition you to the new scoped plugin.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.1.9...v3.0.0

## [2.1.9](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.1.9) (2024-12-19)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.1.8...v2.1.9

## [2.1.8](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.1.8) (2024-11-04)

### What's Changes
- Fix refreshRate Issue

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.1.7...v2.1.8

## [2.1.7](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.1.7) (2024-11-03)

### What's Changes
- Revert to using `axios` instead of `undici`
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.1.6...v2.1.7

## [2.1.6](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.1.6) (2024-10-24)

### What's Changes
- Fix for UI linking issues and refresh issues.
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.1.5...v2.1.6

## [2.1.5](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.1.5) (2024-09-25)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.1.4...v2.1.5

## [2.1.4](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.1.4) (2024-07-16)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.1.3...v2.1.4

## [2.1.3](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.1.3) (2024-07-06)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.1.2...v2.1.3

## [2.1.2](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.1.2) (2024-05-30)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.1.1...v2.1.2

## [2.1.1](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.1.1) (2024-05-29)

### What's Changes
- Fix for UI linking issues and refresh issues.
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.1.0...v2.1.1

## [2.1.0](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.1.0) (2024-05-26)

### What's Changes
- Major refactoring of resideo `device` files.
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.0.1...v2.1.0

## [2.0.1](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.0.1) (2024-04-27)

### What's Changes
- Attempt to fix UI [#822](https://github.com/homebridge-plugins/homebridge-resideo/pull/822), Thanks [@bwp91](https://github.com/bwp91)

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v2.0.0...v2.0.1

## [2.0.0](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v2.0.0) (2024-01-31)

### What's Changes
- Moved from CommonJS to ES Module
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.4.6...v2.0.0

## [1.4.6](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.4.6) (2024-01-16)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.4.5...v1.4.6

## [1.4.5](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.4.5) (2023-12-15)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.4.4...v1.4.5

## [1.4.4](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.4.4) (2023-11-26)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.4.3...v1.4.4

## [1.4.3](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.4.3) (2023-10-31)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.4.2...v1.4.3

## [1.4.2](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.4.2) (2023-08-27)

### What's Changes
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.4.1...v1.4.2

## [1.4.1](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.4.1) (2023-08-19)

### What's Changes
- Fixed LeakSensor Inital status not pulling on restart.
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.4.0...v1.4.1

## [1.4.0](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.4.0) (2023-08-19)

### What's Changes
- Added Support for reading status of L5 Water Shutoff.
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.3.0...v1.4.0

## [1.3.0](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.3.0) (2023-04-08)

### What's Changes
- Added Config that allows `Auto` mode to be enabled for Thermostats even if API doesn't have `Auto` enabled.
- Housekeeping and updated dependencies.
  - This release will end support for Node v14.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.2.0...v1.3.0

## [1.2.0](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.2.0) (2022-12-08)

### What's Changes
- Added Config that allows device(s) to be published as an external accessory.
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.1.0...v1.2.0

## [1.1.0](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.1.0) (2022-10-18)

### What's Changes
- Added Config to allow manually setting firmware version.
- Housekeeping and updated dependencies.

**Full Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/compare/v1.0.0...v1.1.0

## [1.0.0](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v1.0.0) (2022-09-23)

### What's Changes
- Move from `homebridge-honeywell-home` to `homebridge-resideo`

**homebridge-honeywell-home Changelog**: https://github.com/homebridge-plugins/homebridge-resideo/blob/latest/honeywell/homebridge-honeywell-home-changelog.md