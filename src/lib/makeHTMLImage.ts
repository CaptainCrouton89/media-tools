import { query } from '@r-cli/sdk';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { takeScreenshotOfHtml } from './takeScreenshotOfHtml.js';

/**
 * MakeHTMLImage Implementation
 * 
 * This function generates an HTML image based on a prompt, optionally using
 * style guides or website references.
 * 
 * @param options - Configuration options for HTML image generation
 * @param options.prompt - Required prompt describing the image to generate
 * @param options.styleGuideFile - Optional path to HTML style guide file
 * @param options.websiteStyle - Optional URL to website for style reference
 * @param options.outputPath - Required path where the HTML file should be saved
 */
export async function makeHTMLImage(options: {
  prompt: string;
  styleGuideFile?: string;
  websiteStyle?: string;
  outputPath: string;
}): Promise<void> {
  // Build system prompt
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
  
  // Build user prompt
  const userPrompt = buildUserPrompt(
    options.prompt,
    styleGuideContent,
    options.websiteStyle,
    options.outputPath
  );
  
  // Create tool definition for takeScreenshotOfHtml
  const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'takeScreenshotOfHtml',
        description: 'Take a screenshot or record a video of an HTML file. Use this to verify the generated HTML output.',
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
  
  console.log(`HTML image generation complete. File should be saved to ${options.outputPath}`);
}

/**
 * Build system prompt for HTML image generation
 */
function buildSystemPrompt(): string {
  return `You are an expert HTML designer specializing in creating static web pages optimized for visual presentation. Images you create will be screenshotted and used as frames in videos, or as ads. Your expertise lies in crafting visually compelling, clean designs that translate beautifully to screenshots and images.

CRITICAL: You MUST output ONLY raw HTML code. Do NOT include any explanations, comments, descriptions, or text outside of the HTML. Start immediately with <!DOCTYPE html> and end with </html>. Do NOT ask questions or explain what you will do - just generate the HTML directly. 

Your core responsibilities:
- Create HTML pages at exactly 1920x1080 dimensions for visual consistency
- Design clean, professional layouts with modern web components
- Follow the project's style guide when provided
- Use clean, professional web components like cards, popups, and modern UI elements
- Ensure designs are visually polished and ready for presentation

Visual design standards:
- Keep graphics clean and uncluttered
- Use modern web design patterns and components
- Ensure high contrast and readability
- Maintain consistency with the project's brand guidelines when provided
- Focus on visual hierarchy and information architecture

Technical requirements:
- Structure HTML with semantic elements and proper CSS organization
- Use CSS for styling rather than JavaScript when possible
- The HTML page MUST be exactly 1920x1080 pixels - set the body/html and container elements to width: 1920px and height: 1080px with overflow: hidden
- Include viewport meta tag: <meta name="viewport" content="width=1920, initial-scale=1.0">
- Ensure all assets use relative paths or embedded data
- Use inline CSS or a single style tag for simplicity

OUTPUT REQUIREMENTS:
- You MUST save the complete HTML code to the file path specified in the user prompt
- Use the file system to create the directory if it doesn't exist, then write the HTML content to the specified file path
- The HTML file MUST start with <!DOCTYPE html> and include all necessary HTML structure
- The output HTML MUST be exactly 1920x1080 pixels - enforce this with CSS: html, body { width: 1920px; height: 1080px; margin: 0; padding: 0; overflow: hidden; }
- Include all CSS inline or in a <style> tag
- The HTML file should be complete and ready to use
- Do NOT output the HTML content in your response - save it directly to the file system`;
}

/**
 * Build user prompt with main prompt, style guide, and output path
 */
function buildUserPrompt(
  prompt: string,
  styleGuide: string,
  websiteStyle?: string,
  outputPath?: string
): string {
  let userPrompt = prompt;
  
  if (styleGuide) {
    userPrompt += styleGuide;
  }
  
  if (websiteStyle) {
    userPrompt += `\n\n--- Website Style Reference ---\nUse the following website as a style reference: ${websiteStyle}\n--- End Website Style Reference ---`;
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

