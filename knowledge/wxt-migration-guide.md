# CosenseAIBooster Migration to WXT with Vite

## Background
After evaluating the project structure and the migration challenges, we've found that a direct automated migration from Webpack to WXT (WebExtension Tools) with Vite is more complex than expected due to significant differences in project structure and build methodologies.

## Recommended Migration Approach
The most reliable approach for migrating this project is to:

1. Create a new WXT project with React template
2. Copy the functionality components from the existing project to the new structure
3. Update imports and paths to match the new structure

## Step-by-Step Migration Guide

### 1. Create a new WXT project
```bash
# Create a new directory for the WXT project
mkdir CosenseAIBooster-WXT
cd CosenseAIBooster-WXT

# Initialize a new WXT project with React template
npx wxt@latest init . --template react

# Install dependencies
npm install
```

### 2. Install additional dependencies
```bash
# Install Zustand for state management
npm install zustand

# Install TailwindCSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install other dependencies from the original project
npm install @heroicons/react axios
```

### 3. Configure Tailwind CSS
Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './entrypoints/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Create styles file in `src/styles/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Copy and migrate key functionality components
- Copy the store implementation from `src/store/index.ts`
- Adapt React components from options, popup, and content scripts
- Update API services and utilities

### 5. Update the WXT configuration
Update the `wxt.config.ts` file:
```typescript
import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

export default defineConfig({
  manifest: {
    name: 'Cosense AI Booster',
    description: 'AI assistant for Cosense (formerly Scrapbox)',
    version: '0.1.0',
    permissions: ['storage', 'contextMenus'],
    host_permissions: ['*://scrapbox.io/*', '*://cosen.se/*', 'https://api.openai.com/*'],
    web_accessible_resources: [
      {
        resources: ['assets/*'],
        matches: ['*://scrapbox.io/*', '*://cosen.se/*']
      }
    ],
  },
  vite: () => ({
    plugins: [react()],
    css: {
      postcss: {
        plugins: {
          tailwindcss: {},
          autoprefixer: {},
        },
      },
    },
  }),
});
```

### 6. Create the entrypoints
- Create background script entrypoint
- Create content script with appropriate matches
- Create popup UI with React
- Create options page with React

### 7. Testing and Debugging
- Run the development server: `npm run dev` (WXT handles hot reloading)
- Test the extension in Chrome
- Fix any issues with component rendering or functionality

## Benefits of the WXT migration
1. Simplified project structure
2. Better development experience with hot module replacement
3. Modern build system with Vite
4. TypeScript support out of the box
5. Reduced implementation complexity
6. Better performance with optimized builds

## Timeline
The migration should take approximately 2-4 hours depending on familiarity with the codebase and WXT.
