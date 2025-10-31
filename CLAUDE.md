# media-cli CLAUDE.md

oclif-based CLI for media generation, screenshot/video capture, and config management.

## Architecture

**Framework**: oclif v4 with TypeScript, alias resolution via tsc-alias

**Structure**:
- `bin/media-cli` — Entry point (executable)
- `src/commands/` — Top-level and nested commands (auth/, config/), compiled to `lib/commands`
- `src/lib/` — Core logic (Puppeteer-based screenshot/video, HTML rendering, script generation)
- `src/utils/` — Reusable utilities (config management, prompts, command base class)
- `lib/` — Compiled JavaScript output
- `test-output*/` — Test artifacts (screenshots, videos, voiceovers)

**Build**: `npm run build` → TypeScript compilation + tsc-alias (resolves path aliases)

## Key Patterns

**Command Structure** (oclif):
- Commands inherit from `CommandBase` (src/utils/command-base.ts)
- Nested topics use folder structure: `src/commands/auth/login.ts` → `media-tool auth:login`
- Topic separator: `:` (configured in package.json oclif.topicSeparator)

**Config Management**:
- ConfigManager (src/utils/config-manager.ts) handles credentials, settings
- Accessible via config:get/set commands, used by auth commands

**Media Generation**:
- makeHTMLImage.ts — Puppeteer screenshot from HTML
- makeHTMLVideo.ts — Video generation from HTML templates
- takeScreenshotOfHtml.ts — Screenshot utility (URL/HTML input)
- writeScript.ts — Script generation/voiceover handling

**Dependencies**:
- @oclif/core v4 — Framework
- @r-cli/sdk — Custom SDK for API integration
- puppeteer v21 — Headless Chrome for screenshots/videos
- puppeteer-screen-recorder v2 — Video recording
- dotenv — Environment variables
- typescript v5 with path aliases

## Development

**Commands to know**:
- `npm run build` — Compile TypeScript, resolve path aliases
- `npm test` — Currently a placeholder (no tests configured)

**Common tasks**:
- Add command: Create file in `src/commands/`, inherit from CommandBase
- Add utility: Place in `src/utils/`, export from index if needed
- Add lib function: Create in `src/lib/`, import in commands as needed
- Alias paths: Update `tsconfig.json` paths and tsc-alias will resolve automatically

**Path aliases** (tsconfig.json):
- `@lib/*` → `src/lib/*`
- `@utils/*` → `src/utils/*`
- `@commands/*` → `src/commands/*`

## Notes

- Commands compiled to `lib/commands` — oclif auto-discovers from there
- Built for Node >=18.0.0
- Publish config: public npm package
- Author: Silas Rhyneer
