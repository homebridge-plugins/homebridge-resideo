# Changelog

All notable changes to this project will be documented in this file. This project uses [Semantic Versioning](https://semver.org/)

## [3.1.0](https://github.com/homebridge-plugins/homebridge-resideo/releases/tag/v3.1.0) (2025-09-05)

### What's Changes
- Fix incorrect server references in Internal Server Error messages ([#799](https://github.com/homebridge-plugins/homebridge-resideo/issues/799))
  - Corrected error messages that incorrectly referenced "SmartThings servers" and "Meater Server" to properly reference "Resideo servers/Server"
  - No functional changes to error handling logic, only corrected the messaging text
- Added hold switch functionality for thermostats to remove holds and return to schedule
- Implemented StatefulProgrammableSwitch that allows users to remove thermostat holds via HomeKit scenes and automation
- Switch state reflects current hold status (OFF for active hold, ON for following schedule)  
- Uses existing `statefulStatus` configuration option for backward compatibility
- Enhances thermostat control similar to functionality available in other smart thermostat integrations
- Fixes [#798](https://github.com/homebridge-plugins/homebridge-resideo/issues/798)
- Added device discovery feature to help users find device IDs for configuration.
  - New `/getAvailableDevices` endpoint in configuration UI that fetches all devices from Resideo API
  - Enhanced DEVICES tab with "Available Devices from Resideo" section showing all devices in user's account
  - Displays device information including Device ID, name, class, model, location, and online status
  - Helps users find device IDs for devices that were reset or newly added to their Resideo account
  - Fixes issue where devices disappeared from cached accessories list after being reset
- Fix L5 Water Shutoff valve API endpoints to use correct Resideo shutoffvalve endpoints and status parsing, resolves [#887](https://github.com/homebridge-plugins/homebridge-resideo/issues/887) & [#785](https://github.com/homebridge-plugins/homebridge-resideo/issues/785)
  - Corrected API endpoints from `/waterLeakDetectors/{deviceID}` to `/shutoffvalve/{deviceID}` for status retrieval
  - Updated valve control API from POST `/waterLeakDetectors/{deviceID}` to PUT `/shutoffvalve/{deviceID}/control`
  - Ensures proper communication with Resideo's shutoff valve API for accurate device control and status updates
  - Fixed valve status parsing to use `actuatorValve.valveStatus` instead of just device alive status
  - Valve state now correctly reflects actual device open/closed status
- Housekeeping and updated dependencies.

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
