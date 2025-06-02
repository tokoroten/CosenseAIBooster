# Migration Plan from Webpack to WXT

## Project Structure
1. Create a new structure based on WXT conventions:
   - Move source files to appropriate locations in the new project
   - Update imports and paths

## Components to Migrate
1. Core Components:
   - Background script
   - Content script
   - Popup UI
   - Options page
   - Shared utilities
   - API services

2. React Components:
   - Settings components
   - UI components
   - Menu components

3. State Management:
   - Zustand store
   - Storage utilities

## Migration Steps
1. Copy the components from old project to the new structure:
   - Align with WXT's entrypoints directory structure
   - Update imports and paths

2. Configure WXT:
   - Set up manifest properties
   - Configure build settings
   - Set up Tailwind CSS

3. Update scripts in package.json:
   - Build
   - Dev
   - Package

4. Test the extension:
   - Build and load the extension in Chrome
   - Test all features

## Timeline
1. Setup the basic WXT project structure - Done
2. Copy and adapt the core files - Next
3. Test and fix issues - After migration
4. Validate all functionality works as expected - Final step
