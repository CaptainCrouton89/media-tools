import { query } from '@r-cli/sdk';
import { readFile } from 'fs/promises';
import * as path from 'path';

/**
 * WriteScript Implementation
 * 
 * This function generates a script from source material based on the provided prompt.
 * 
 * @param options - Configuration options for script generation
 * @param options.prompt - Required prompt describing what script to generate
 * @param options.sourceMaterial - Optional array of file paths to source material
 * @param options.withVisuals - Required flag indicating whether to include visual elements
 * @param options.strictDuration - Optional duration in seconds for strict timing
 * @param options.granularity - Required granularity level for script generation
 * @param options.outputDirectory - Required directory path where the script should be saved
 */
export async function writeScript(options: {
  prompt: string;
  sourceMaterial?: string[];
  withVisuals: boolean;
  strictDuration?: number;
  granularity: number;
  outputDirectory: string;
}): Promise<void> {
  // Build system prompt based on granularity and withVisuals
  const systemPrompt = buildSystemPrompt(options.granularity, options.withVisuals);
  
  // Read source material if provided
  let sourceMaterialContent = '';
  if (options.sourceMaterial && options.sourceMaterial.length > 0) {
    const sourceContents = await Promise.all(
      options.sourceMaterial.map(async (filePath) => {
        try {
          const content = await readFile(filePath, 'utf-8');
          const fileName = path.basename(filePath);
          return `--- Source Material: ${fileName} ---\n${content}\n--- End ${fileName} ---`;
        } catch (error) {
          throw new Error(`Failed to read source material file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })
    );
    sourceMaterialContent = '\n\n' + sourceContents.join('\n\n');
  }
  
  // Build user prompt
  const userPrompt = buildUserPrompt(options.prompt, sourceMaterialContent, options.outputDirectory);
  
  // Generate script
  let script = await generateScript(systemPrompt, userPrompt);
  
  // Estimate duration and adjust if needed
  if (options.strictDuration) {
    const estimatedDuration = estimateDuration(script);
    const targetDuration = options.strictDuration;
    const tolerance = targetDuration * 0.1; // 10% tolerance
    
    if (Math.abs(estimatedDuration - targetDuration) > tolerance) {
      const adjustmentPrompt = buildAdjustmentPrompt(
        script,
        estimatedDuration,
        targetDuration,
        options.outputDirectory
      );
      script = await generateScript(systemPrompt, adjustmentPrompt);
    }
  }
  
  // Script is saved by the AI to outputDirectory
  // Output confirmation message
  console.log(`Script generated and saved to ${options.outputDirectory}`);
}

/**
 * Build system prompt based on granularity (1-10) and withVisuals flag
 */
function buildSystemPrompt(granularity: number, withVisuals: boolean): string {
  // Script output template - different templates for with/without visuals
  const scriptTemplateWithVisuals = `SCRIPT OUTPUT TEMPLATE:
You MUST follow this exact format for the script output:

---
# [SCRIPT TITLE]

## [Optional: Brief Description/Overview]

---

## SCENE 1: [Scene Title]
[Timestamp: 00:00 - 00:XX]

[VISUAL/SHOT DESCRIPTION]
[Detailed description of what's on screen]
[Camera angles, shots, composition]
[Visual elements, graphics, text overlays, animations]

[ACTION/DIRECTION]
[What happens in this scene]
[Character movements and actions]

[DIALOGUE]
SPEAKER NAME: [Dialogue text here]

[AUDIO/MUSIC]
[Music suggestions, sound effects, audio cues]

[TRANSITION]
[How to transition to next scene]

---

## SCENE 2: [Scene Title]
[Timestamp: 00:XX - 00:YY]

... (repeat structure for each scene)

---

## [Optional: Closing/Outro Section]

---

END OF SCRIPT

IMPORTANT FORMATTING RULES (WITH VISUALS):
- Each scene MUST start with "## SCENE [number]: [Title]"
- Include timestamps in format [Timestamp: MM:SS - MM:SS]
- Use all caps for section headers (## SCENE, VISUAL, ACTION, DIALOGUE, AUDIO/MUSIC, TRANSITION)
- VISUAL/SHOT DESCRIPTION section is REQUIRED for every scene
- Include detailed camera direction and shot composition
- Speaker names in dialogue should be in ALL CAPS followed by colon
- Separate sections with "---" dividers
- Maintain consistent formatting throughout`;

  const scriptTemplateWithoutVisuals = `CRITICAL INSTRUCTIONS FOR OUTPUT:

You MUST output ONLY the raw voiceover script text - nothing else.

DO NOT include:
- Title or header text
- Markdown formatting
- Timestamps
- Scene headers
- Section markers
- Dividers or separators
- Metadata (word count, duration, etc.)
- Explanations or commentary
- File creation references
- Any text before or after the script

OUTPUT ONLY:
The continuous voiceover text that should be read aloud. If multiple speakers, use format: "Speaker Name: [text]". Otherwise, output plain continuous text with no formatting whatsoever.

Start your response immediately with the script text. Do not preface it with anything.`;

  const scriptTemplate = withVisuals ? scriptTemplateWithVisuals : scriptTemplateWithoutVisuals;

  // Base template
  const baseTemplate = `You are a professional scriptwriter. Generate a video script following these guidelines:

${scriptTemplate}

STYLE:
- Natural, engaging dialogue
- Clear narrative flow
- Appropriate pacing for the content type
- Production-ready format`;

  // Adjust granularity (1 = broad, 10 = extremely detailed)
  let granularityInstructions = '';
  if (granularity <= 3) {
    granularityInstructions = `
GRANULARITY LEVEL ${granularity}/10 (LOW):
- Provide high-level overview and main points
- Focus on broad narrative structure
- Include key dialogue and main scenes only
- Less detail on transitions and minor elements`;
  } else if (granularity <= 6) {
    granularityInstructions = `
GRANULARITY LEVEL ${granularity}/10 (MEDIUM):
- Include detailed scene descriptions
- Provide dialogue with natural pacing
- Include transition notes between scenes
- Specify key visual and audio cues`;
  } else {
    granularityInstructions = `
GRANULARITY LEVEL ${granularity}/10 (HIGH):
- Extremely detailed scene-by-scene breakdown
- Include precise dialogue with timing notes
- Detailed visual descriptions for each moment
- Specific audio cues, music suggestions, and sound effects
- Transition details and pacing markers
- Include camera direction and shot composition notes when relevant`;
  }
  
  // Adjust for visuals
  let visualsInstructions = '';
  if (withVisuals) {
    visualsInstructions = `
VISUAL ELEMENTS REQUIRED:
- Include detailed visual descriptions for each scene
- Specify camera angles, shots, and composition
- Describe visual elements, graphics, text overlays, or animations
- Note visual transitions and effects
- Include any specific visual references or styles`;
  } else {
    visualsInstructions = `
VOICEOVER ONLY - RAW SCRIPT TEXT:
- Output ONLY the raw voiceover text - just the words that will be spoken
- NO formatting, NO timestamps, NO scene headers, NO section markers
- NO visual descriptions, actions, directions, audio cues, or transitions
- NO title, header, metadata, or commentary
- NO file creation or file references
- Just plain continuous text - the script that should be read aloud
- Start immediately with the script text - no introduction or explanation`;
  }
  
  return `${baseTemplate}${granularityInstructions}${visualsInstructions}

OUTPUT REQUIREMENTS:
- You MUST strictly follow the SCRIPT OUTPUT TEMPLATE/CRITICAL INSTRUCTIONS provided above
- Generate a complete script using the exact format specified
- Save the script file to the output directory specified in the user prompt
- Use an appropriate filename for the script (e.g., script.txt or script.md)
- Create the output directory if it doesn't exist
- The script file should contain only the script content following the template format`;
}

/**
 * Build user prompt with main prompt, source material, and output directory
 */
function buildUserPrompt(prompt: string, sourceMaterial: string, outputDirectory: string): string {
  let userPrompt = prompt;
  
  if (sourceMaterial) {
    userPrompt += sourceMaterial;
  }
  
  userPrompt += `\n\nSave the generated script to the directory: ${outputDirectory}`;
  
  return userPrompt;
}

/**
 * Generate script using AI query
 */
async function generateScript(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    const queryResult = query({
      prompt: userPrompt,
      options: {
        systemPrompt: systemPrompt,
      },
    });
    
    // Extract text from the async generator
    let fullText = '';
    for await (const message of queryResult) {
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
    
    if (!fullText) {
      throw new Error('No text content received from AI query');
    }
    
    return fullText;
  } catch (error) {
    throw new Error(`Failed to generate script: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Estimate script duration based on word count
 * Uses average reading speed of ~175 words per minute (~2.9 words per second)
 */
function estimateDuration(script: string): number {
  // Count words (simple word count, treating punctuation as separators)
  const wordCount = script
    .split(/\s+/)
    .filter(word => word.length > 0)
    .length;
  
  // Average reading speed: ~175 words per minute = ~2.9 words per second
  const wordsPerSecond = 2.9;
  const estimatedSeconds = Math.ceil(wordCount / wordsPerSecond);
  
  return estimatedSeconds;
}

/**
 * Build adjustment prompt for rewriting script to match duration
 */
function buildAdjustmentPrompt(
  currentScript: string,
  currentDuration: number,
  targetDuration: number,
  outputDirectory: string
): string {
  const isTooLong = currentDuration > targetDuration;
  const durationDiff = Math.abs(currentDuration - targetDuration);
  const minutes = Math.floor(durationDiff / 60);
  const seconds = durationDiff % 60;
  
  const durationNote = minutes > 0 
    ? `${minutes} minute${minutes > 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
    : `${seconds} second${seconds !== 1 ? 's' : ''}`;
  
  const instruction = isTooLong
    ? `The current script is approximately ${durationNote} too long (estimated ${currentDuration}s, target ${targetDuration}s). Please rewrite it to be shorter while maintaining the core content and narrative flow.`
    : `The current script is approximately ${durationNote} too short (estimated ${currentDuration}s, target ${targetDuration}s). Please expand it to reach the target duration while maintaining narrative quality.`;
  
  return `Here is the current script:\n\n${currentScript}\n\n${instruction}\n\nMaintain the same format, style, and quality. Adjust the length appropriately to meet the target duration. Save the updated script to the directory: ${outputDirectory}`;
}

