# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is an Astro-based SaaS starter template. Astro is a web framework for building fast, content-focused websites.

## Common Commands

### Development
- `npm run dev` - Start development server at http://localhost:4321
- `npm run build` - Build the production site to `./dist/`
- `npm run preview` - Preview the production build locally
- `npm run astro` - Run Astro CLI commands directly

### Project Structure
The codebase follows Astro's conventions:
- `src/pages/` - File-based routing. Each `.astro` file becomes a route
- `public/` - Static assets served directly without processing
- `astro.config.mjs` - Astro configuration (integrations, output mode, etc.)

### Key Technical Details
- TypeScript is configured with strict mode via `tsconfig.json`
- The project uses Astro v5.8.0
- No testing framework is currently configured
- Claude Code is installed as a development dependency

### Working Practices
- Always use Git to make atomic commits while you work on this project
- You can push to git once you have completed tasks
- Run tests whenever you are making changes to confirm you aren't making breaking changes

### AI Development Guidelines
- Use web search to understand how to implement code whenever you work on a feature

### Important Notes
- Due to ShadCN + React issues, you will need to ask me to run these commands myself