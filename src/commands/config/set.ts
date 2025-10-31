import { Args } from '@oclif/core';
import { BaseCommand } from '../../utils/command-base.js';
import { ConfigManager } from '../../utils/config-manager.js';

export default class ConfigSet extends BaseCommand {
  static override description = 'Set configuration value';

  static override args = {
    key: Args.string({
      description: 'Configuration key (currently only "token" is supported)',
      required: true,
    }),
    value: Args.string({
      description: 'Configuration value',
      required: true,
    }),
  };

  static override examples = [
    '<%= config.bin %> <%= command.id %> token your_token_here',
  ];

  async run(): Promise<void> {
    const { args } = await this.parse(ConfigSet);

    if (args.key !== 'token') {
      this.error('Currently only "token" is a supported configuration key');
    }

    if (!args.value || args.value.trim().length === 0) {
      this.error('Value cannot be empty');
    }

    await ConfigManager.writeToken(args.value.trim());

    this.log(`\n✓ Configuration updated`);
    this.log(`Config file: ${ConfigManager.getConfigPath()}`);
    this.log(`Set ${args.key} = ${args.value.substring(0, 8)}...\n`);
  }
}
