import { execSync } from "child_process";
import {
    readFileSync,
    renameSync,
    unlinkSync,
} from "fs";
import { resolve } from "path";
import puppeteer from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";

/**
 * TakeScreenshotOfHtml Tool Function
 * 
 * This function provides screenshot and recording capabilities for HTML files
 * using Puppeteer. It can be used as a tool for AI agents to verify HTML output.
 * 
 * @param options - Configuration options for screenshot/recording
 * @param options.htmlFilePath - Path to HTML file to screenshot or record
 * @param options.outputPath - Output path for the screenshot/video file
 * @param options.mode - 'screenshot' or 'record' mode
 * @param options.duration - Duration in seconds for recording (required if mode is 'record')
 * @param options.format - Format for screenshot ('png' | 'jpeg') or video ('mp4')
 * @param options.width - Viewport width in pixels (default: 1920)
 * @param options.height - Viewport height in pixels (default: 1080)
 */
export async function takeScreenshotOfHtml(options: {
  htmlFilePath: string;
  outputPath?: string;
  mode: 'screenshot' | 'record';
  duration?: number;
  format?: 'png' | 'jpeg' | 'mp4';
  width?: number;
  height?: number;
}): Promise<string> {
  const {
    htmlFilePath,
    outputPath,
    mode,
    duration,
    format = mode === 'screenshot' ? 'png' : 'mp4',
    width = 1920,
    height = 1080,
  } = options;

  // Validate recording mode
  if (mode === 'record' && duration === undefined) {
    throw new Error('Duration is required when mode is "record"');
  }

  // Set default output path based on format if not provided
  const finalOutputPath = outputPath || (mode === 'screenshot' ? `screenshot.${format}` : `recording.${format}`);

  // Resolve the HTML file path
  const resolvedHtmlPath = resolve(htmlFilePath);

  // Check if file exists
  try {
    readFileSync(resolvedHtmlPath);
  } catch (error) {
    throw new Error(`HTML file not found: ${resolvedHtmlPath}`);
  }

  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // Set viewport to specified dimensions
    await page.setViewport({ width, height });

    // Navigate to the HTML file
    await page.goto(`file://${resolvedHtmlPath}`, { waitUntil: 'networkidle0' });

    if (mode === 'screenshot') {
      // Wait for page to load completely
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Take screenshot
      await page.screenshot({
        path: finalOutputPath as `${string}.png` | `${string}.jpeg`,
        type: format as 'png' | 'jpeg',
      });

      return finalOutputPath;
    } else {
      // Recording mode
      // Create temp output path for the recording
      const tempOutputPath = `temp_recording_${Date.now()}.mp4`;

      // Set up the screen recorder
      const recorder = new PuppeteerScreenRecorder(page, {
        fps: 30,
        videoFrame: {
          width,
          height,
        },
        aspectRatio: '16:9',
      });

      // Start recording
      await recorder.start(tempOutputPath);

      // Wait for the specified duration
      await new Promise(resolve => setTimeout(resolve, (duration || 0) * 1000));

      // Stop recording
      await recorder.stop();

      // Convert to desired format if not MP4
      if (format !== "mp4") {
        try {
          // Check if ffmpeg is available
          execSync("ffmpeg -version", { stdio: "ignore" });

          // Convert using ffmpeg
          const ffmpegCommand = `ffmpeg -i "${tempOutputPath}" -y "${finalOutputPath}"`;
          execSync(ffmpegCommand, { stdio: "ignore" });

          // Remove the temp file
          unlinkSync(tempOutputPath);
        } catch (error) {
          // If ffmpeg is not available, just rename the file
          console.error("FFmpeg not found, keeping MP4 format");
          renameSync(tempOutputPath, finalOutputPath.replace(`.${format}`, ".mp4"));
          throw new Error(
            "FFmpeg not found. Install FFmpeg to convert to other formats, or use MP4 format."
          );
        }
      } else {
        // Just rename the MP4 file to the desired output path
        renameSync(tempOutputPath, finalOutputPath);
      }

      return finalOutputPath;
    }
  } finally {
    // Close the browser
    await browser.close();
  }
}

