import { ConfigManager } from '../../utils/config-manager.js';
import { prompt } from '../../utils/prompt.js';
import { BaseCommand } from '../../utils/command-base.js';

export default class AuthLogin extends BaseCommand {
  static override description = 'Authenticate with your API token';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    this.log('\n🔑 Authentication');
    this.log('Enter your authentication token.\n');

    const token = await prompt('Enter your authentication token', { hide: true });

    if (!token || token.trim().length === 0) {
      this.error('Token cannot be empty');
    }

    // Save the token to config
    await ConfigManager.writeToken(token.trim());

    this.log(`\n✓ Authentication successful!`);
    this.log(`Token saved to: ${ConfigManager.getConfigPath()}\n`);
  }
}
