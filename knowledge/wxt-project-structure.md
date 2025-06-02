# WXT Project Structure Example

This document provides an example of the project structure for a WXT-based extension with React, which can be used as a reference during migration.

## Directory Structure
```
CosenseAIBooster-WXT/
├── entrypoints/
│   ├── background.ts
│   ├── content.ts
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── Popup.tsx
│   │   └── style.css
│   └── options/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       └── style.css
├── components/
│   ├── Header.tsx
│   ├── Settings.tsx
│   └── ... (other shared components)
├── hooks/
│   └── useStorage.ts
├── store/
│   └── index.ts
├── utils/
│   ├── react-cosense-dom.ts
│   ├── react-cosense-menu.tsx
│   └── react-speech-recognition.ts
├── api/
│   └── service.ts
├── public/
│   └── icon/
│       ├── 16.png
│       ├── 32.png
│       ├── 48.png
│       ├── 96.png
│       └── 128.png
├── wxt.config.ts
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── tsconfig.json
```

## Key Files and Their Purpose

### Configuration Files
- `wxt.config.ts`: Main configuration for WXT
- `tailwind.config.js`: TailwindCSS configuration
- `tsconfig.json`: TypeScript configuration

### Entrypoints
- `entrypoints/background.ts`: Background script
- `entrypoints/content.ts`: Content script that runs on matching pages
- `entrypoints/popup/`: Popup UI files
- `entrypoints/options/`: Options page files

### Components and State Management
- `components/`: Shared React components
- `store/`: Zustand store for state management
- `hooks/`: Custom React hooks
- `utils/`: Utility functions and classes

## Migration Tips
1. Start with the configuration files
2. Create the entrypoints
3. Migrate the shared components and utilities
4. Implement state management
5. Test each component after migration
