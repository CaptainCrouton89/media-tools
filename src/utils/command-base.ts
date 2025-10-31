import { Command } from '@oclif/core';
import { ConfigManager } from './config-manager.js';
import { prompt } from './prompt.js';

/**
 * Generic base class for CLI commands
 * Provides common utilities like config access and authentication handling
 *
 * To use with your service:
 * 1. Extend this class in your commands
 * 2. Override getConfig() if you need custom config loading
 * 3. Implement service-specific client initialization as needed
 */
export abstract class BaseCommand extends Command {
  /**
   * Load configuration from file, env vars, and dotenv
   * Override this method to add service-specific config logic
   */
  protected async getConfig(): Promise<Record<string, string>> {
    return ConfigManager.load();
  }

  /**
   * Prompt the user to enter their authentication credentials
   * Override this method to customize authentication flow for your service
   */
  protected async promptForAuthentication(): Promise<void> {
    this.log('\n🔑 No authentication token found.');
    this.log('Please enter your authentication token.\n');

    const token = await prompt('Enter your authentication token', { hide: true });

    // Save the token to config
    await ConfigManager.writeToken(token);

    this.log('✓ Token saved successfully!\n');
  }

  /**
   * Handle authentication errors (401/403)
   * Override this method for service-specific error handling
   */
  protected async handleAuthError(error: any): Promise<void> {
    // Check if this is an authentication error
    const isAuthError =
      error?.response?.status === 401 ||
      error?.response?.status === 403 ||
      error?.message?.toLowerCase().includes('unauthorized') ||
      error?.message?.toLowerCase().includes('authentication') ||
      error?.message?.toLowerCase().includes('invalid token');

    if (!isAuthError) {
      throw error; // Re-throw if not an auth error
    }

    // Clear the invalid token
    this.warn('Invalid or expired authentication token');
    await ConfigManager.deleteToken();

    // Re-prompt for authentication
    await this.promptForAuthentication();
  }
}

