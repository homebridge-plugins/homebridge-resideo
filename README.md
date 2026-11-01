<p align="center">
   <a href="https://github.com/homebridge-plugins/homebridge-resideo"><img alt="homebridge-resideo" src="https://raw.githubusercontent.com/homebridge-plugins/homebridge-resideo/latest/branding/Homebridge_x_Resideo.png" width="600px"></a>
</p>
<span align="center">

## homebridge-resideo

Homebridge plugin to integrate Resideo (Honeywell Home) devices into HomeKit

[![npm](https://img.shields.io/npm/v/@homebridge-plugins/homebridge-resideo/latest?label=latest)](https://www.npmjs.com/package/@homebridge-plugins/homebridge-resideo)
[![npm](https://img.shields.io/npm/v/@homebridge-plugins/homebridge-resideo/beta?label=beta)](https://github.com/homebridge/homebridge/wiki/How-to-Install-Alternate-Plugin-Versions)<br>
[![verified-by-homebridge](https://img.shields.io/badge/homebridge-verified-blueviolet?color=%23491F59&style=flat)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)<br>
[![npm](https://img.shields.io/npm/dt/@homebridge-plugins/homebridge-resideo)](https://www.npmjs.com/package/@homebridge-plugins/homebridge-resideo)
[![Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=hb-discord)](https://discord.gg/bHjKNkN)

</span>

### Plugin Information

- This plugin allows you to view and control your [Resideo](https://www.resideo.com) (Honeywell Home) devices within HomeKit. The plugin:
  - requires a (free) Resideo developer account to work - this is separate from the Resideo account you use in the Resideo app
  - connects to the Resideo cloud to discover and control your devices
  - uses Matter automatically when Matter is turned on in Homebridge, and uses HomeKit (HAP) otherwise

### Prerequisites

- To use this plugin, you will need to already have:
  - [Node](https://nodejs.org): latest version of `v22`, `v24` or `v26` - any other major version is not supported.
  - [Homebridge](https://homebridge.io): `v2` - refer to link for more information and installation instructions.

### Setup

- [Installation](https://github.com/homebridge-plugins/homebridge-resideo/wiki/Installation)
- [Configuration](https://github.com/homebridge-plugins/homebridge-resideo/wiki/Configuration)
- [Beta Version](https://github.com/homebridge-plugins/homebridge-resideo/wiki/Beta-Version)
- [Node Version](https://github.com/homebridge-plugins/homebridge-resideo/wiki/Node-Version)

### Supported Devices

- T10 Thermostat - already HomeKit certified
- T9 Thermostat - already HomeKit certified
  - T9 Smart Roomsensors
- T6 Thermostat - already HomeKit certified
- T5 Thermostat - already HomeKit certified
- Round Thermostat - already HomeKit certified
- Some Total Comfort Control thermostats
  - Pushing commands may not be supported on some.
- WiFi Water Leak & Freeze Detector
- Water Shutoff Valves

### Help/About

- [Common Errors](https://github.com/homebridge-plugins/homebridge-resideo/wiki/Common-Errors)
- [Support Request](https://github.com/homebridge-plugins/homebridge-resideo/issues/new/choose)
- [Changelog](https://github.com/homebridge-plugins/homebridge-resideo/blob/latest/CHANGELOG.md)

### Credits

- To [@donavanbecker](https://github.com/donavanbecker): the original creator and maintainer of this plugin.
- To the creators/contributors of [Homebridge](https://homebridge.io) who make this plugin possible.

### Disclaimer

- I am in no way affiliated with Resideo or Honeywell and this plugin is a personal project that I maintain in my free time.
- Use this plugin entirely at your own risk - please see licence for more information.
