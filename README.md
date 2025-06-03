# Cohort Identifier

A TypeScript ESM project for cohort identification.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

```bash
npm install
```

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled JavaScript
- `npm run dev` - Run the TypeScript directly using tsx
- `npm run watch` - Compile TypeScript in watch mode
- `npm run clean` - Remove the dist directory

## Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run in development mode:

   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
cohort-identifier/
├── src/
│   └── index.ts          # Main entry point
├── dist/                 # Compiled JavaScript (generated)
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## Features

- TypeScript with strict type checking
- ESM (ES Modules) support
- Modern JavaScript target (ES2022)
- Development server with tsx
- Source maps for debugging
- Comprehensive .gitignore for TypeScript projects
