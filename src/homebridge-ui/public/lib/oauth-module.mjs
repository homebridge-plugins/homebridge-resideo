/* Copyright(C) 2017-2025, homebridge-plugins/homebridge-resideo developers. All rights reserved.
 *
 * oauth-module.mjs: OAuth authentication module for Resideo plugin.
 */

/**
 * OAuth authentication module for Resideo plugin setup.
 */
export class OAuthModule {
  constructor() {
    this.hostname = window.location.hostname;
  }

  /**
   * Validates OAuth credentials format.
   */
  validateCredentials(key, secret) {
    if (!key || !secret) {
      return { valid: false, message: 'Please enter both Consumer Key and Consumer Secret.' };
    }

    if (key.length < 10 || secret.length < 10) {
      return { 
        valid: false, 
        message: 'Consumer Key and Secret appear to be too short. Please verify your credentials.' 
      };
    }

    return { valid: true };
  }

  /**
   * Sets up OAuth flow with popup window.
   */
  async startOAuthFlow(key, secret) {
    try {
      await homebridge.request('Start Resideo Login Server');
      
      const w = 450;
      const h = 700;
      const y = window.top.outerHeight / 2 + window.top.screenY - (h / 2);
      const x = window.top.outerWidth / 2 + window.top.screenX - (w / 2);
      
      const urlToOpen = `http://${this.hostname}:8585/start?` +
        `key=${encodeURIComponent(key)}&` +
        `secret=${encodeURIComponent(secret)}&` +
        `host=${encodeURIComponent(this.hostname)}`;
      
      const popup = window.open(
        urlToOpen, 
        'resideo-auth',
        `toolbar=no, location=no, directories=no, status=no, menubar=no scrollbars=no, resizable=no, copyhistory=no, ` +
        `width=${w}, height=${h}, top=${y}, left=${x}`
      );

      return popup;
    } catch (error) {
      console.error('OAuth flow error:', error);
      throw error;
    }
  }

  /**
   * Verifies OAuth completion with multiple attempts.
   */
  async verifyOAuthCompletion(popup, maxAttempts = 10) {
    return new Promise((resolve) => {
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          
          let verificationAttempts = 0;
          
          const verifyCredentials = () => {
            verificationAttempts++;
            
            const updatedConfig = homebridge.getPluginConfig();
            const credentials = Array.isArray(updatedConfig) && updatedConfig[0]?.credentials;
            
            // Check for minimum required credentials
            const hasMinimumAuth = credentials?.consumerKey && 
                                 credentials?.consumerSecret && 
                                 credentials?.refreshToken;
            
            const hasCompleteAuth = hasMinimumAuth && credentials?.accessToken;
            
            if (hasCompleteAuth) {
              resolve({ success: true, complete: true });
            } else if (hasMinimumAuth && verificationAttempts >= maxAttempts) {
              // Minimum credentials are acceptable
              resolve({ success: true, complete: false, message: 'Minimum credentials received' });
            } else if (verificationAttempts >= maxAttempts) {
              resolve({ 
                success: false, 
                message: 'Authentication incomplete. Please try the setup process again.' 
              });
            } else {
              setTimeout(verifyCredentials, 1000);
            }
          };
          
          setTimeout(verifyCredentials, 500);
        }
      }, 1000);
    });
  }

  /**
   * Sets up OAuth credential reception handler.
   */
  setupCredentialHandler() {
    homebridge.addEventListener('creds-received', async (event) => {
      try {
        if (event.data.access && event.data.refresh) {
          const currentConfig = [{
            platform: 'Resideo',
            name: 'Resideo',
            credentials: {
              consumerKey: event.data.key,
              consumerSecret: event.data.secret,
              accessToken: event.data.access,
              refreshToken: event.data.refresh
            }
          }];
          
          await homebridge.updatePluginConfig(currentConfig);
          await homebridge.savePluginConfig();
          
          setTimeout(() => {
            homebridge.toast.success("Successfully Linked Resideo Account", "homebridge-resideo");
          }, 200);
        }
      } catch (err) {
        console.error('Credential handling error:', err);
        homebridge.toast.error('Setup failed. Please try again.', 'Error');
      }
    });
  }
}