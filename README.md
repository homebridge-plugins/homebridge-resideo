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

### Setup

- Installation
  - Search for "Resideo" on the plugin screen of the [Homebridge UI](https://github.com/homebridge/homebridge-config-ui-x) and click **Install**.
- Configuration
  1. Login or create an account at the [Resideo developer portal](https://developer.honeywellhome.com/user).
  2. Click **Create New App**, give your application a name, and copy the hostname shown in the plugin settings intro into the **Callback URL** field.

<p align="center">

<img alt="Resideo developer portal app setup" src="https://user-images.githubusercontent.com/9875439/192078620-6998511c-1c11-4e06-b7e1-475b22ef5180.png" width="300px">

</p>

  3. Enter the generated consumer key and secret into the plugin settings and click **Link Account**.

<p align="center">

<img alt="Resideo account linking" src="https://user-images.githubusercontent.com/9875439/192078614-e568d121-e0e4-4123-bdda-4238e8a6e601.png" width="300px">

</p>

  4. Login to your Resideo account, click **Allow**, select your devices, and click **Connect**.
     - Selecting all devices is recommended - you can hide devices you don't want in the Home app later, by device ID.
  5. Click **Save** and restart Homebridge.
     - If you plan to run this plugin in a child bridge, configure that before restarting, and remember to add the child bridge to the Home app.

### Supported Devices

- [T10 Thermostat](https://www.resideo.com/us/en/products/air/thermostats/wifi-thermostats/t10-pro-smart-thermostat-with-redlinkr-room-sensor-thx321wfs2001w-u/) - already HomeKit certified
- [T9 Thermostat](https://www.resideo.com/us/en/products/air/thermostats/wifi-thermostats/t9-smart-thermostat-with-sensor-rcht9610wfsw2003-u/) - already HomeKit certified
  - [T9 Smart Roomsensors](https://www.resideo.com/us/en/products/air/thermostat-accessories/t9-smart-sensor-rchtsensor-1pk-u/)
- [T6 Thermostat](https://www.resideo.com/us/en/products/air/thermostats/wifi-thermostats/t6-pro-smart-thermostat-multi-stage-3-heat-2-cool-th6320wf2003-u/) - already HomeKit certified
- [T5 Thermostat](https://www.resideo.com/us/en/products/air/thermostats/wifi-thermostats/t5-smart-thermostat-with-c-wire-adapter-rcht8612wf2005-u/) - already HomeKit certified
- [Round Thermostat](https://www.resideo.com/us/en/products/air/thermostats/wifi-thermostats/the-round-smart-thermostat-rch9310wf5003-u/) - already HomeKit certified
- Some Total Comfort Control thermostats
  - Pushing commands may not be supported on some.
- [WiFi Water Leak & Freeze Detector](https://www.resideo.com/us/en/products/water/spot-leak-detection/wifi-water-leak-freeze-detector-rchw3610wf1001-u/)
- Water Shutoff Valves

### Help/About

- [Support Request](https://github.com/homebridge-plugins/homebridge-resideo/issues/new/choose)
- [Changelog](https://github.com/homebridge-plugins/homebridge-resideo/blob/latest/CHANGELOG.md)
- [About Me](https://github.com/sponsors/bwp91)

### Credits

- To [@donavanbecker](https://github.com/donavanbecker): the original creator and maintainer of this plugin.
- To the creators/contributors of [Homebridge](https://homebridge.io) who make this plugin possible.

### Disclaimer

- I am in no way affiliated with Resideo or Honeywell and this plugin is a personal project that I maintain in my free time.
- Use this plugin entirely at your own risk - please see licence for more information.
