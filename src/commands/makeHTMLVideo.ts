import { Args, Flags } from '@oclif/core';
import { makeHTMLVideo as makeHTMLVideoImpl } from '../lib/makeHTMLVideo.js';
import { BaseCommand } from '../utils/command-base.js';

export default class MakeHTMLVideo extends BaseCommand {
  static override description = 'Generate an animated HTML page optimized for video recording';

  static override args = {
    prompt: Args.string({
      description: 'Prompt describing the video to generate',
      required: true,
    }),
  };

  static override flags = {
    styleGuideFile: Flags.string({
      char: 's',
      description: 'Path to HTML style guide file',
      required: false,
    }),
    scriptFile: Flags.string({
      char: 'f',
      description: 'Path to script file with scene timing information',
      required: false,
    }),
    outputPath: Flags.string({
      char: 'o',
      description: 'Output path for the HTML file',
      required: true,
    }),
  };

  static override examples = [
    '<%= config.bin %> <%= command.id %> "An animated landing page with hero section" --outputPath ./video.html',
    '<%= config.bin %> <%= command.id %> "Product demo animation" --styleGuideFile ./style-guide.html --scriptFile ./script.txt --outputPath ./video.html',
    '<%= config.bin %> <%= command.id %> "Tutorial animation sequence" --scriptFile ./script.txt --outputPath ./video.html',
  ];

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MakeHTMLVideo);

    this.log('Generating HTML video...\n');

    // Call implementation
    await makeHTMLVideoImpl({
      prompt: args.prompt,
      styleGuideFile: flags.styleGuideFile,
      scriptFile: flags.scriptFile,
      outputPath: flags.outputPath,
    });

    this.log('\n✓ HTML video generation complete');
  }
}

