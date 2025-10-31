import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';

interface Config {
  token?: string;
  [key: string]: string | undefined;
}

/**
 * Configuration manager for CLI applications
 * Handles config file storage, environment variables, and dotenv loading
 *
 * To customize for your app:
 * 1. Change APP_NAME in getConfigDir()
 * 2. Update interface Config with your config keys
 * 3. Add environment variable names in load() method
 */
export class ConfigManager {
  private static readonly APP_NAME = 'cli-app'; // TODO: Change to your app name

  /**
   * Get the path to the config directory
   */
  static getConfigDir(): string {
    // Use XDG config directory on Linux, ~/.config on macOS, %LOCALAPPDATA% on Windows
    const configHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
    return path.join(configHome, this.APP_NAME);
  }

  /**
   * Get the path to the config file
   */
  static getConfigPath(): string {
    return path.join(this.getConfigDir(), 'config');
  }

  /**
   * Ensure the config directory exists
   */
  private static ensureConfigDir(): void {
    const dir = this.getConfigDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Read the entire config file
   */
  static readConfig(): Config {
    const configPath = this.getConfigPath();

    if (!fs.existsSync(configPath)) {
      return {};
    }

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // If config file is corrupted, return empty config
      return {};
    }
  }

  /**
   * Write the entire config file
   */
  static writeConfig(config: Config): void {
    this.ensureConfigDir();
    const configPath = this.getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  /**
   * Load config from hierarchy: dotenv → env vars → config file
   * Returns merged config with precedence: env vars > .env > config file
   */
  static load(): Promise<Record<string, string>> {
    // Load .env files
    dotenv.config({ path: '.env.local' });
    dotenv.config({ path: '.env' });

    const config = this.readConfig();
    const merged: Record<string, string> = {};

    // Start with config file
    Object.entries(config).forEach(([key, value]) => {
      if (value) {
        merged[key] = value;
      }
    });

    // Override with environment variables
    Object.entries(process.env).forEach(([key, value]) => {
      if (value && (key.startsWith('APP_') || key === 'AUTH_TOKEN')) {
        merged[key] = value;
      }
    });

    return Promise.resolve(merged);
  }

  /**
   * Read the token from config file
   */
  static readToken(): string | null {
    const config = this.readConfig();
    return config.token || null;
  }

  /**
   * Save the token to config file
   */
  static async writeToken(token: string): Promise<void> {
    const config = this.readConfig();
    config.token = token;
    this.writeConfig(config);
  }

  /**
   * Delete the token from config file
   */
  static async deleteToken(): Promise<void> {
    const config = this.readConfig();
    delete config.token;
    this.writeConfig(config);
  }

  /**
   * Check if a token exists in the config
   */
  static hasToken(): boolean {
    return this.readToken() !== null;
  }

  /**
   * Get a specific config value
   */
  static get(key: string): string | null {
    const config = this.readConfig();
    return (config[key] as string) || null;
  }

  /**
   * Set a specific config value
   */
  static set(key: string, value: string): void {
    const config = this.readConfig();
    config[key] = value;
    this.writeConfig(config);
  }

  /**
   * Delete a specific config value
   */
  static delete(key: string): void {
    const config = this.readConfig();
    delete config[key];
    this.writeConfig(config);
  }
}
