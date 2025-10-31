import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../utils/command-base.js';
import { writeScript as writeScriptImpl } from '../lib/writeScript.js';

export default class WriteScript extends BaseCommand {
  static override description = 'Generate a script from source material';

  static override args = {
    prompt: Args.string({
      description: 'Prompt describing what script to generate',
      required: true,
    }),
  };

  static override flags = {
    sourceMaterial: Flags.string({
      char: 's',
      description: 'Path to source material file(s)',
      multiple: true,
      required: false,
    }),
    withVisuals: Flags.boolean({
      char: 'v',
      description: 'Include visual elements in the script (required)',
    }),
    strictDuration: Flags.integer({
      char: 'd',
      description: 'Strict duration in seconds for the script',
      required: false,
    }),
    granularity: Flags.integer({
      char: 'g',
      description: 'Granularity level for script generation',
      required: true,
    }),
    outputDirectory: Flags.string({
      char: 'o',
      description: 'Directory where the script should be saved',
      required: true,
    }),
  };

  static override examples = [
    '<%= config.bin %> <%= command.id %> "Create a 5-minute video script" --withVisuals --granularity 5 --outputDirectory ./scripts',
    '<%= config.bin %> <%= command.id %> "Script idea" --sourceMaterial ./material1.txt --sourceMaterial ./material2.txt --withVisuals --granularity 3 --strictDuration 300 --outputDirectory ./output',
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(WriteScript);

    // Validate required flags
    if (flags.granularity === undefined) {
      this.error('--granularity flag is required');
    }

    this.log('Generating script...\n');

    // Call implementation
    await writeScriptImpl({
      prompt: args.prompt,
      sourceMaterial: flags.sourceMaterial,
      withVisuals: flags.withVisuals ?? false,
      strictDuration: flags.strictDuration,
      granularity: flags.granularity,
      outputDirectory: flags.outputDirectory,
    });

    this.log('\n✓ Script generation complete');
  }
}

