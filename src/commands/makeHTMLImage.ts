import { Args, Flags } from '@oclif/core';
import { makeHTMLImage as makeHTMLImageImpl } from '../lib/makeHTMLImage.js';
import { BaseCommand } from '../utils/command-base.js';

export default class MakeHTMLImage extends BaseCommand {
  static override description = 'Generate an HTML image from a prompt';

  static override args = {
    prompt: Args.string({
      description: 'Prompt describing the image to generate',
      required: true,
    }),
  };

  static override flags = {
    styleGuideFile: Flags.string({
      char: 's',
      description: 'Path to HTML style guide file',
      required: false,
    }),
    websiteStyle: Flags.string({
      char: 'w',
      description: 'URL to website for style reference',
      required: false,
    }),
    outputPath: Flags.string({
      char: 'o',
      description: 'Output path for the HTML file',
      required: true,
    }),
  };

  static override examples = [
    '<%= config.bin %> <%= command.id %> "A modern landing page hero section" --outputPath ./output.html',
    '<%= config.bin %> <%= command.id %> "Product showcase card" --styleGuideFile ./style-guide.html --outputPath ./output.html',
    '<%= config.bin %> <%= command.id %> "Navigation bar" --websiteStyle https://example.com --outputPath ./output.html',
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MakeHTMLImage);

    this.log('Generating HTML image...\n');

    // Call implementation
    await makeHTMLImageImpl({
      prompt: args.prompt,
      styleGuideFile: flags.styleGuideFile,
      websiteStyle: flags.websiteStyle,
      outputPath: flags.outputPath,
    });

    this.log('\n✓ HTML image generation complete');
  }
}

