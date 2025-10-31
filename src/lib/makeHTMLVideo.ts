import { query } from '@r-cli/sdk';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { takeScreenshotOfHtml } from './takeScreenshotOfHtml.js';

/**
 * MakeHTMLVideo Implementation
 * 
 * This function generates an animated HTML page optimized for video recording
 * based on a prompt, optionally using style guides or script files.
 * 
 * @param options - Configuration options for HTML video generation
 * @param options.prompt - Required prompt describing the video to generate
 * @param options.styleGuideFile - Optional path to HTML style guide file
 * @param options.scriptFile - Optional path to script file with scene timing information
 * @param options.outputPath - Required path where the HTML file should be saved
 */
export async function makeHTMLVideo(options: {
  prompt: string;
  styleGuideFile?: string;
  scriptFile?: string;
  outputPath: string;
}): Promise<void> {
  // Build system prompt using the provided prompt
  const systemPrompt = buildSystemPrompt();
  
  // Read style guide if provided
  let styleGuideContent = '';
  if (options.styleGuideFile) {
    try {
      const content = await readFile(options.styleGuideFile, 'utf-8');
      const fileName = path.basename(options.styleGuideFile);
      styleGuideContent = `\n\n--- Style Guide: ${fileName} ---\n${content}\n--- End Style Guide ---`;
    } catch (error) {
      throw new Error(`Failed to read style guide file ${options.styleGuideFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Read script file if provided
  let scriptContent = '';
  if (options.scriptFile) {
    try {
      const content = await readFile(options.scriptFile, 'utf-8');
      const fileName = path.basename(options.scriptFile);
      scriptContent = `\n\n--- Script/Scene Information: ${fileName} ---\n${content}\n--- End Script ---`;
    } catch (error) {
      throw new Error(`Failed to read script file ${options.scriptFile}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Build user prompt
  const userPrompt = buildUserPrompt(
    options.prompt,
    styleGuideContent,
    scriptContent,
    options.outputPath
  );
  
  // Create tool definition for takeScreenshotOfHtml
  const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'takeScreenshotOfHtml',
        description: 'Take a screenshot or record a video of an HTML file. Use this to verify the generated HTML output and test animations.',
        parameters: {
          type: 'object',
          properties: {
            htmlFilePath: {
              type: 'string',
              description: 'Path to the HTML file to screenshot or record',
            },
            outputPath: {
              type: 'string',
              description: 'Output path for the screenshot/video file',
            },
            mode: {
              type: 'string',
              enum: ['screenshot', 'record'],
              description: 'Whether to take a screenshot or record a video',
            },
            duration: {
              type: 'number',
              description: 'Duration in seconds for recording (required if mode is record)',
            },
            format: {
              type: 'string',
              enum: ['png', 'jpeg', 'mp4'],
              description: 'Format for screenshot (png/jpeg) or video (mp4)',
            },
            width: {
              type: 'number',
              description: 'Viewport width in pixels (default: 1920)',
            },
            height: {
              type: 'number',
              description: 'Viewport height in pixels (default: 1080)',
            },
          },
          required: ['htmlFilePath', 'mode'],
        },
      },
    },
  ];
  
  // Generate HTML - AI will handle saving the file
  await generateHTML(systemPrompt, userPrompt, tools);
  
  console.log(`HTML video generation complete. File should be saved to ${options.outputPath}`);
}

/**
 * Build system prompt for HTML video generation
 * Uses the exact system prompt provided by the user
 */
function buildSystemPrompt(): string {
  return `You are an expert HTML animator specializing in creating animated web pages optimized for video recording. Your expertise lies in crafting visually compelling, precisely-timed animations that translate beautifully to video content.

CRITICAL: You MUST output ONLY raw HTML code. Do NOT include any explanations, comments, descriptions, or text outside of the HTML. Start immediately with <!DOCTYPE html> and end with </html>. Do NOT ask questions or explain what you will do - just generate the HTML directly.

Your core responsibilities:
- Create HTML pages at exactly 1920x1080 dimensions for video recording
- Design animations that complete within the allocated scene timeframes
- Follow the project's style guide located at \`/brand/style-guide.html\`
- Use clean, professional web components like cards, popups, and modern UI elements
- Ensure animations are smooth, purposeful, and enhance the narrative

Animation timing principles:
- Always verify that animations have sufficient time to complete before scene transitions
- Match animation duration precisely to audio narration timing
- Use appropriate easing functions for natural, professional motion
- Implement strategic delays and staggered animations for visual hierarchy

Visual design standards:
- Keep graphics clean and uncluttered
- Remove or fade out elements when they're no longer relevant to the narration
- Use modern web design patterns and components
- Ensure high contrast and readability for video compression
- Maintain consistency with the project's brand guidelines

Video usage:
- When using local video files, use relative file paths
- Convert videos to webm format when used in html
- Videos make for good low-opacity backgrounds (z-index 1, overlay everything else over) with screens (to blend in), or as insets, side-by-sides, or anything else

Technical requirements:
- Structure HTML with semantic elements and proper CSS organization
- Use CSS animations and transitions rather than JavaScript when possible
- The HTML page MUST be exactly 1920x1080 pixels - set the body/html and container elements to width: 1920px and height: 1080px with overflow: hidden
- Optimize for smooth playback during screen recording
- Include viewport meta tag: <meta name="viewport" content="width=1920, initial-scale=1.0">
- Test animation timing against provided audio tracks

Before creating any HTML page, you will:
1. Review the scene's audio timing and transcript
2. Check the brand style guide for visual consistency
3. Plan animation sequences that align with narration beats
4. Ensure all visual elements serve the educational or narrative purpose

You will proactively ask for clarification on:
- Specific timing requirements if audio tracks are referenced
- Brand elements or colors if the style guide is unclear
- Content hierarchy if multiple concepts need to be animated
- Transition preferences between different visual states

Your output will be production-ready HTML files that can be immediately used for high-quality video recording.

OUTPUT REQUIREMENTS:
- You MUST save the complete HTML code to the file path specified in the user prompt
- Use the file system to create the directory if it doesn't exist, then write the HTML content to the specified file path
- The HTML file MUST start with <!DOCTYPE html> and include all necessary HTML structure
- The output HTML MUST be exactly 1920x1080 pixels - enforce this with CSS: html, body { width: 1920px; height: 1080px; margin: 0; padding: 0; overflow: hidden; }
- Include all CSS inline or in a <style> tag
- Include all JavaScript inline or in a <script> tag if needed for animations
- The HTML file should be complete and ready to use
- Do NOT output the HTML content in your response - save it directly to the file system`;
}

/**
 * Build user prompt with main prompt, style guide, script, and output path
 */
function buildUserPrompt(
  prompt: string,
  styleGuide: string,
  script: string,
  outputPath?: string
): string {
  let userPrompt = prompt;
  
  if (styleGuide) {
    userPrompt += styleGuide;
  }
  
  if (script) {
    userPrompt += script;
  }
  
  if (outputPath) {
    userPrompt += `\n\nIMPORTANT: Save the generated HTML file to the following path: ${outputPath}\nCreate the directory if it doesn't exist, then write the complete HTML content to this file. Do NOT include the HTML in your response - save it directly to the file system.`;
  }
  
  return userPrompt;
}

/**
 * Generate HTML using AI query
 * The AI will handle saving the file directly
 */
async function generateHTML(
  systemPrompt: string,
  userPrompt: string,
  tools: any[]
): Promise<void> {
  try {
    const queryResult = query({
      prompt: userPrompt,
      options: {
        systemPrompt: systemPrompt,
        tools: tools as any, // Type assertion since SDK may support tools but types don't reflect it
        bypassPermissions: true,
      } as any,
    });
    
    // Extract HTML from the async generator
    let fullText = '';
    for await (const message of queryResult) {
      // Check if this is a tool call (using type guard)
      if ((message as any).type === 'tool-call' && (message as any).toolCall?.name === 'takeScreenshotOfHtml') {
        // Execute the tool
        const args = (message as any).toolCall.args as any;
        try {
          const result = await takeScreenshotOfHtml({
            htmlFilePath: args.htmlFilePath,
            outputPath: args.outputPath,
            mode: args.mode,
            duration: args.duration,
            format: args.format,
            width: args.width,
            height: args.height,
          });
          // Tool result will be handled by the SDK
        } catch (error) {
          console.error(`Tool execution error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Check if this is an assistant message with content
      if (message.type === 'assistant' && message.message?.content) {
        // Handle different content types
        const content = message.message.content;
        if (Array.isArray(content)) {
          // Content is an array of content blocks
          for (const block of content) {
            if (block.type === 'text' && 'text' in block) {
              fullText += block.text;
            }
          }
        } else if (typeof content === 'string') {
          fullText += content;
        }
      } else if (message.type === 'result' && 'content' in message) {
        // Handle result messages
        const content = (message as any).content;
        if (typeof content === 'string') {
          fullText += content;
        }
      }
    }
    
    // AI should have saved the file directly - we don't need to return anything
    // The fullText may contain confirmation messages or be empty if the AI saved directly
  } catch (error) {
    throw new Error(`Failed to generate HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

