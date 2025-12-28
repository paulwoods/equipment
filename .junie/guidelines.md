# Project Guidelines

This document provides project-level instructions and conventions for Junie to follow when working on the Equipment Management system.

## Project Structure
The project is a Next.js application using the App Router.

- `src/app/`: Contains the application routes and server actions.
- `src/components/`: Reusable UI components.
- `src/lib/`: Core logic and data access (e.g., `equipmentStore.ts`).
- `src/types/`: TypeScript interfaces and types.
- `data/`: Default local JSON storage for equipment data (configurable via `EQUIPMENT_DATA_DIR` environment variable).
- `public/`: Static assets like icons and images.

## Technology Stack
- **Framework**: Next.js 16+ (App Router)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **State/Persistence**: Local file-based JSON storage (default `data/equipment.json`). The directory can be changed using the `EQUIPMENT_DATA_DIR` environment variable.
- **Icons**: Lucide React
- **Markdown**: EasyMDE and React Markdown

## Coding Standards
- Use TypeScript for all new code. Ensure types are correctly defined in `src/types/`.
- Follow the existing component structure in `src/components/`.
- Use Tailwind CSS for styling, adhering to the project's design tokens.
- Maintain consistency with the existing naming conventions (e.g., PascalCase for components, camelCase for functions and variables).

## Development and Verification
- **Linting**: Run `npm run lint` to check for linting errors.
- **Type Checking**: Run `npm run test` (which executes `tsc`) to ensure type safety.
- **Build**: Run `npm run build` to verify the project builds successfully before submitting significant changes.
- **Testing**: Currently, there is no automated test suite beyond type checking. For logic changes, verify manually or by adding a reproduction script if requested.

## Guidelines for Junie
- Always ensure that data persistence logic in `src/lib/equipmentStore.ts` is respected.
- When adding new features, update both the UI in `src/app/` and the necessary types/logic in `src/types/` and `src/lib/`.
- If modifying the data structure, ensure backward compatibility with existing JSON data if possible.
