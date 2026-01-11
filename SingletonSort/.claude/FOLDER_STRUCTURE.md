# Recommended Folder Structure

This document outlines the recommended folder structure for organizing code as the project grows.

## Current Structure
```
src/
├── app/
│   ├── app.ts              # Root component
│   ├── app.html            # Root template
│   ├── app.scss            # Root styles
│   ├── app.spec.ts         # Root component tests
│   ├── app.config.ts       # Application configuration
│   ├── app.config.server.ts
│   ├── app.routes.ts       # Client routes
│   └── app.routes.server.ts
├── main.ts                 # Client entry point
├── main.server.ts          # Server entry point
├── server.ts               # Express SSR server
├── styles.scss             # Global styles
└── index.html              # HTML shell

public/                     # Static assets
└── favicon.ico
```

## Recommended Growth Structure

As the application grows, organize code following this structure:

```
src/app/
├── core/                   # Singleton services, guards, interceptors (imported once)
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   └── role.guard.ts
│   ├── interceptors/
│   │   ├── auth.interceptor.ts
│   │   └── error.interceptor.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── api.service.ts
│   │   └── storage.service.ts
│   └── models/             # Core domain models
│       └── user.model.ts
│
├── shared/                 # Reusable components, directives, pipes
│   ├── components/
│   │   ├── button/
│   │   │   ├── button.ts
│   │   │   ├── button.html
│   │   │   ├── button.scss
│   │   │   └── button.spec.ts
│   │   ├── card/
│   │   └── modal/
│   ├── directives/
│   │   ├── tooltip.directive.ts
│   │   └── highlight.directive.ts
│   ├── pipes/
│   │   ├── date-format.pipe.ts
│   │   └── safe-html.pipe.ts
│   └── utils/
│       ├── validators.ts
│       └── helpers.ts
│
├── features/               # Feature modules (lazy-loadable)
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── dashboard.ts
│   │   │   ├── dashboard.html
│   │   │   ├── dashboard.scss
│   │   │   └── dashboard.spec.ts
│   │   ├── services/
│   │   │   └── dashboard.service.ts
│   │   └── models/
│   │       └── dashboard-data.model.ts
│   │
│   ├── auth/
│   │   ├── components/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── services/
│   │   └── guards/
│   │
│   └── user-profile/
│       ├── components/
│       ├── services/
│       └── models/
│
├── layout/                 # Layout components
│   ├── header/
│   │   ├── header.ts
│   │   ├── header.html
│   │   └── header.scss
│   ├── footer/
│   ├── sidebar/
│   └── nav/
│
├── app.ts                  # Root component
├── app.html
├── app.scss
├── app.config.ts           # App configuration
└── app.routes.ts           # Route configuration
```

## Naming Conventions

### Files
- **Components**: `feature-name.ts`, `feature-name.html`, `feature-name.scss`
- **Services**: `feature-name.service.ts`
- **Guards**: `feature-name.guard.ts`
- **Interceptors**: `feature-name.interceptor.ts`
- **Pipes**: `feature-name.pipe.ts`
- **Directives**: `feature-name.directive.ts`
- **Models/Interfaces**: `feature-name.model.ts` or `feature-name.interface.ts`
- **Tests**: `feature-name.spec.ts`

### Classes
- **Components**: `FeatureName` (no "Component" suffix)
- **Services**: `FeatureNameService`
- **Guards**: `FeatureNameGuard`
- **Pipes**: `FeatureNamePipe`
- **Directives**: `FeatureNameDirective`

### Selectors
- **Components**: `app-feature-name`
- **Directives**: `appFeatureName`

## Organization Principles

### Core Directory
- Contains **singleton services** used throughout the app
- Imported only **once** in `app.config.ts`
- Examples: AuthService, ApiService, LoggerService
- Should not contain components

### Shared Directory
- Contains **reusable** components, directives, and pipes
- Can be imported by **any feature**
- Should be **stateless** and **generic**
- No feature-specific logic

### Features Directory
- Each feature is **self-contained**
- Can be **lazy-loaded** for better performance
- Contains feature-specific components, services, and models
- Feature routes defined within the feature

### Layout Directory
- Contains structural components (header, footer, sidebar)
- Used to compose the overall application layout
- Typically imported by the root component or route layouts

## Lazy Loading Example

For features that should be lazy-loaded:

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/components/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'profile',
    loadChildren: () => import('./features/user-profile/profile.routes').then(m => m.PROFILE_ROUTES)
  }
];
```

## State Management (Future)

If state management becomes needed:

```
src/app/
├── store/                  # Global state (NgRx, Signals, etc.)
│   ├── actions/
│   ├── reducers/
│   ├── effects/
│   ├── selectors/
│   └── state.ts
```

Or for signal-based state:

```
src/app/
├── state/
│   ├── user.state.ts
│   ├── app.state.ts
│   └── feature.state.ts
```

## Assets Organization

```
public/
├── images/
│   ├── logos/
│   ├── icons/
│   └── backgrounds/
├── fonts/
├── data/                   # JSON data files
└── favicon.ico
```

## Testing Structure

Tests should be co-located with source files:
- Component tests: `component-name.spec.ts`
- Service tests: `service-name.service.spec.ts`
- Integration tests: `src/app/tests/integration/`
- E2E tests: Would typically be in a separate `e2e/` directory at project root

## Environment Configuration (Future)

If environment-specific configuration is needed:

```
src/
├── environments/
│   ├── environment.ts
│   ├── environment.development.ts
│   └── environment.production.ts
```

## Key Principles

1. **Feature-based organization** over type-based
2. **Colocation** of related files
3. **Lazy loading** for features when appropriate
4. **Separation of concerns** (core vs shared vs features)
5. **Scalability** - structure should support growth
6. **Discoverability** - easy to find related code
