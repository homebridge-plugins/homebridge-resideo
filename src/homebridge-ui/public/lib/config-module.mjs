/* Copyright(C) 2017-2025, homebridge-plugins/homebridge-resideo developers. All rights reserved.
 *
 * config-module.mjs: Configuration management module for Resideo plugin.
 */

/**
 * Configuration management module for Resideo plugin.
 */
export class ConfigModule {
  constructor() {
    // Initialize configuration management
  }

  /**
   * Checks if first-run setup is required.
   */
  isFirstRunRequired() {
    const currentConfig = homebridge.getPluginConfig();
    if (!Array.isArray(currentConfig) || !currentConfig[0]) {
      return true;
    }
    
    const config = currentConfig[0];
    const credentials = config?.credentials;
    
    if (!credentials) {
      return true;
    }
    
    // Check for minimum credentials needed to skip first-run
    const hasMinimumCredentials = credentials.consumerKey && 
                                credentials.consumerKey.trim() !== '' &&
                                credentials.consumerSecret && 
                                credentials.consumerSecret.trim() !== '' &&
                                credentials.refreshToken && 
                                credentials.refreshToken.trim() !== '';
    
    return !hasMinimumCredentials;
  }

  /**
   * Creates a clean initial configuration.
   */
  createInitialConfig(key, secret) {
    return [{
      platform: 'Resideo',
      name: 'Resideo',
      credentials: {
        consumerKey: key,
        consumerSecret: secret
      }
    }];
  }

  /**
   * Updates plugin configuration.
   */
  async updateConfig(config) {
    try {
      await homebridge.updatePluginConfig(config);
      return { success: true };
    } catch (error) {
      console.error('Config update error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Gets current plugin configuration.
   */
  getCurrentConfig() {
    const config = homebridge.getPluginConfig();
    return Array.isArray(config) ? config[0] : null;
  }

  /**
   * Validates configuration structure.
   */
  validateConfig(config) {
    if (!config) {
      return { valid: false, message: 'Configuration is missing' };
    }

    if (config.platform !== 'Resideo') {
      return { valid: false, message: 'Invalid platform configuration' };
    }

    if (!config.credentials) {
      return { valid: false, message: 'Credentials are missing' };
    }

    return { valid: true };
  }
}