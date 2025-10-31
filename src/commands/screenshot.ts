import { Args, Flags } from '@oclif/core';
import { takeScreenshotOfHtml } from '../lib/takeScreenshotOfHtml.js';
import { BaseCommand } from '../utils/command-base.js';

export default class Screenshot extends BaseCommand {
  static override description = 'Take a screenshot of an HTML file';

  static override args = {
    htmlFilePath: Args.string({
      description: 'Path to HTML file to screenshot',
      required: true,
    }),
  };

  static override flags = {
    outputPath: Flags.string({
      char: 'o',
      description: 'Output path for the screenshot file',
      required: false,
    }),
    format: Flags.string({
      char: 'f',
      description: 'Format for screenshot (png or jpeg)',
      default: 'png',
      options: ['png', 'jpeg'],
    }),
    width: Flags.integer({
      char: 'w',
      description: 'Viewport width in pixels',
      default: 1920,
    }),
    height: Flags.integer({
      char: 'h',
      description: 'Viewport height in pixels',
      default: 1080,
    }),
  };

  static override examples = [
    '<%= config.bin %> <%= command.id %> ./scene.html',
    '<%= config.bin %> <%= command.id %> ./scene.html --outputPath ./screenshot.png',
    '<%= config.bin %> <%= command.id %> ./scene.html --format jpeg --width 1920 --height 1080',
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Screenshot);

    this.log('Taking screenshot...\n');

    try {
      const outputPath = await takeScreenshotOfHtml({
        htmlFilePath: args.htmlFilePath,
        outputPath: flags.outputPath,
        mode: 'screenshot',
        format: flags.format as 'png' | 'jpeg',
        width: flags.width,
        height: flags.height,
      });

      this.log(`\n✓ Screenshot saved to: ${outputPath}`);
    } catch (error) {
      this.error(`Failed to take screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

