import { ConfigManager } from '../../utils/config-manager.js';
import { confirm } from '../../utils/prompt.js';
import { BaseCommand } from '../../utils/command-base.js';

export default class AuthLogout extends BaseCommand {
  static override description = 'Remove stored authentication token';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    if (!ConfigManager.hasToken()) {
      this.log('No stored token found.');
      return;
    }

    const confirmed = await confirm('Are you sure you want to remove your stored authentication token?');

    if (!confirmed) {
      this.log('Logout cancelled.');
      return;
    }

    await ConfigManager.deleteToken();

    this.log(`\n✓ Token removed from: ${ConfigManager.getConfigPath()}`);
    this.log('You will need to authenticate again to use the CLI.\n');
  }
}
