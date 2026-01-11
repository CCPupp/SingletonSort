# SingletonSort - Angular Project Context

## Project Overview
- **Framework**: Angular 20.1
- **TypeScript**: 5.8.2
- **Styling**: SCSS
- **SSR**: Enabled with Express server
- **Testing**: Karma + Jasmine

## Architecture & Patterns

### Component Architecture
- **Standalone Components**: This project uses standalone components (no NgModules)
- **Signals API**: Using Angular signals for reactive state management
- **Naming Convention**: Component classes are named without the "Component" suffix (e.g., `App` not `AppComponent`)

### File Structure Conventions
- Component files use separate template and style files:
  - `component-name.ts` - Component logic
  - `component-name.html` - Template
  - `component-name.scss` - Styles
  - `component-name.spec.ts` - Tests

### TypeScript Configuration
- **Strict Mode**: Enabled with comprehensive strict checks
- **Strict Templates**: Angular strict template type checking enabled
- **Target**: ES2022
- **Decorators**: Experimental decorators enabled

## Key Files & Locations

### Core Application Files
- `src/app/app.ts` - Root component
- `src/app/app.config.ts` - Application configuration (providers)
- `src/app/app.routes.ts` - Client-side routes
- `src/main.ts` - Client bootstrap
- `src/main.server.ts` - Server bootstrap
- `src/server.ts` - Express SSR server

### Configuration Files
- `angular.json` - Angular CLI configuration
- `tsconfig.json` - Base TypeScript configuration
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.spec.json` - Test-specific TypeScript config
- `package.json` - Dependencies and scripts

### Assets & Styles
- `src/styles.scss` - Global styles
- `public/` - Static assets (favicon, etc.)

## Development Patterns

### Component Creation
When creating new components:
1. Use standalone: true (implicit with imports array)
2. Import dependencies in the imports array
3. Use signals for reactive state
4. Separate template and style files
5. Name class without "Component" suffix

Example:
```typescript
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-example',
  imports: [/* dependencies */],
  templateUrl: './example.html',
  styleUrl: './example.scss'
})
export class Example {
  protected readonly myState = signal('initial value');
}
```

### Routing
- Routes defined in `app.routes.ts`
- Uses functional route configuration
- SSR-specific routes in `app.routes.server.ts`

### Providers & Dependency Injection
- Configure providers in `app.config.ts`
- Use `ApplicationConfig` type
- Current providers:
  - Zone change detection with event coalescing
  - Router
  - Client hydration with event replay
  - Global error listeners

### SSR Configuration
- Server entry point: `src/server.ts`
- SSR enabled with hydration and event replay for better performance
- Build output mode: "server"

## Available Scripts
- `npm start` - Development server
- `npm run build` - Production build
- `npm run watch` - Watch mode build
- `npm test` - Run tests
- `npm run serve:ssr:SingletonSort` - Serve SSR build

## Code Quality Standards
- Strict TypeScript enabled
- Prettier configured for HTML (Angular parser)
- No implicit returns, overrides, or fallthrough cases
- Strict injection parameters and template checking

## Where to Create New Files

### Components
- Main app components: `src/app/`
- Feature modules: `src/app/[feature-name]/`
- Shared components: `src/app/shared/components/`

### Services
- Core services: `src/app/core/services/`
- Feature services: `src/app/[feature-name]/services/`
- Shared services: `src/app/shared/services/`

### Models/Interfaces
- `src/app/models/` or `src/app/[feature-name]/models/`

### Guards/Interceptors
- `src/app/core/guards/`
- `src/app/core/interceptors/`

## Current Project State
- Fresh Angular project with default setup
- SSR configured and ready
- Minimal dependencies
- No additional features or libraries added yet

## Notes for AI Assistant
- Always use signals for reactive state (avoid Subject/BehaviorSubject unless needed for specific RxJS use cases)
- Components are standalone - no need to create or import NgModules
- Maintain strict TypeScript compliance
- Follow the established naming convention (no "Component" suffix)
- When creating components, use separate HTML/SCSS files
- Respect the Prettier HTML configuration
