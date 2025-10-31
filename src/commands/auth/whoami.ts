import { Flags } from '@oclif/core';
import { ConfigManager } from '../../utils/config-manager.js';
import { BaseCommand } from '../../utils/command-base.js';

export default class AuthWhoami extends BaseCommand {
  static override description = 'Show authentication status';

  static override flags = {
    json: Flags.boolean({
      char: 'j',
      description: 'Output as JSON',
    }),
  };

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ];

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthWhoami);

    const token = ConfigManager.readToken();

    if (!token) {
      this.error('Not authenticated. Run "auth:login" to authenticate.');
    }

    const info = {
      authenticated: true,
      hasToken: true,
      tokenPreview: token.substring(0, 8) + '...',
      configPath: ConfigManager.getConfigPath(),
    };

    if (flags.json) {
      this.log(JSON.stringify(info, null, 2));
      return;
    }

    this.log('\n✓ Authenticated');
    this.log(`Token: ${info.tokenPreview}`);
    this.log(`Stored at: ${info.configPath}\n`);
  }
}
