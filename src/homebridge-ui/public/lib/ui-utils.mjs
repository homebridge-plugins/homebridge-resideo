/* Copyright(C) 2017-2025, homebridge-plugins/homebridge-resideo developers. All rights reserved.
 *
 * ui-utils.mjs: UI utility functions for Resideo plugin.
 */

/**
 * UI utility functions for Resideo plugin.
 */
export class UIUtils {
  /**
   * Shows error message in specified element.
   */
  static showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
      errorDiv.innerHTML = `<div class="alert alert-danger"><strong>Error:</strong> ${message}</div>`;
    }
  }

  /**
   * Shows success message in specified element.
   */
  static showSuccess(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
      errorDiv.innerHTML = `<div class="alert alert-success"><strong>Success!</strong> ${message}</div>`;
    }
  }

  /**
   * Shows warning message in specified element.
   */
  static showWarning(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
      errorDiv.innerHTML = `<div class="alert alert-warning"><strong>Warning:</strong> ${message}</div>`;
    }
  }

  /**
   * Clears message in specified element.
   */
  static clearMessage(elementId) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
      errorDiv.innerHTML = '&nbsp;';
    }
  }

  /**
   * Gets form field value by ID.
   */
  static getFieldValue(fieldId) {
    const field = document.getElementById(fieldId);
    return field ? field.value.trim() : '';
  }

  /**
   * Sets form field value by ID.
   */
  static setFieldValue(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
      field.value = value;
    }
  }

  /**
   * Copy text to clipboard functionality.
   */
  static setupCopyToClipboard() {
    window.copyMyText = () => {
      const textToCopy = document.getElementById("copyMe");
      if (textToCopy) {
        textToCopy.select();
        document.execCommand("copy");
      }
    };
  }

  /**
   * Handle different types of errors with appropriate user feedback.
   */
  static handleError(error, elementId) {
    console.error('UI Error:', error);
    
    let message = 'An unexpected error occurred. Please try again.';
    
    if (error.message) {
      if (error.message.includes('port')) {
        message = 'OAuth server port conflict. Please wait a moment and try again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        message = 'Network error. Please check your connection and try again.';
      } else {
        message = error.message;
      }
    }
    
    UIUtils.showError(elementId, message);
  }

  /**
   * Show loading state on button.
   */
  static setButtonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId);
    if (button) {
      if (loading) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Processing...';
      } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || 'Submit';
      }
    }
  }

  /**
   * Store original button text for loading states.
   */
  static storeButtonText(buttonId) {
    const button = document.getElementById(buttonId);
    if (button && !button.dataset.originalText) {
      button.dataset.originalText = button.innerHTML;
    }
  }
}