export const MIGRATION_TARGETS = {
  react: {
    id: 'react',
    label: 'React + TypeScript',
    description: 'Modern SPA with Vite, component architecture, and API integration layer',
    architecture: 'React 19 SPA with feature-based modules, TanStack Query data layer, and REST/GraphQL BFF',
    techStack: ['React 19', 'TypeScript', 'Vite', 'TanStack Query', 'Zustand', 'React Router', 'Tailwind CSS'],
    tooling: ['Vitest', 'Playwright', 'ESLint', 'Storybook'],
    effortMultiplier: 1.0,
    phase3Title: 'React Feature Module Migration',
    phase3Objectives: [
      'Re-implement UI flows as React feature modules with typed API clients',
      'Introduce design system and shared component library',
      'Migrate state management to hooks + lightweight store',
    ],
    moduleSuffix: '-feature',
  },
  nextjs: {
    id: 'nextjs',
    label: 'Next.js (React)',
    description: 'Full-stack React with SSR/SSG, API routes, and edge-ready deployment',
    architecture: 'Next.js App Router with server components, API routes, and incremental migration via route groups',
    techStack: ['Next.js 15', 'React 19', 'TypeScript', 'Server Actions', 'Prisma/Drizzle', 'Tailwind CSS'],
    tooling: ['Vitest', 'Playwright', 'Vercel/AWS deployment'],
    effortMultiplier: 1.1,
    phase3Title: 'Next.js Route & API Migration',
    phase3Objectives: [
      'Map legacy screens to Next.js app router segments',
      'Extract BFF logic into route handlers / server actions',
      'Enable SSR for SEO-critical flows and client hydration for interactive modules',
    ],
    moduleSuffix: '-route-group',
  },
  angular: {
    id: 'angular',
    label: 'Angular',
    description: 'Enterprise Angular with modules, services, and RxJS data flows',
    architecture: 'Angular standalone components with lazy-loaded feature routes and NgRx/signals state',
    techStack: ['Angular 19', 'TypeScript', 'RxJS', 'Angular Material', 'NgRx Signals'],
    tooling: ['Jest', 'Cypress', 'ESLint', 'Nx monorepo (optional)'],
    effortMultiplier: 1.15,
    phase3Title: 'Angular Feature Library Migration',
    phase3Objectives: [
      'Carve legacy domains into Angular feature libraries',
      'Rebuild services with HttpClient and typed DTOs',
      'Apply dependency injection patterns for cross-cutting concerns',
    ],
    moduleSuffix: '-lib',
  },
  vue: {
    id: 'vue',
    label: 'Vue 3 + TypeScript',
    description: 'Progressive Vue 3 with composition API and Pinia state',
    architecture: 'Vue 3 SPA with composables, Pinia stores, and Vue Router feature modules',
    techStack: ['Vue 3', 'TypeScript', 'Vite', 'Pinia', 'Vue Router', 'Tailwind CSS'],
    tooling: ['Vitest', 'Cypress', 'ESLint'],
    effortMultiplier: 0.95,
    phase3Title: 'Vue Composable Migration',
    phase3Objectives: [
      'Rebuild screens as Vue SFCs with composition API',
      'Extract shared logic into composables',
      'Migrate API access to typed service modules',
    ],
    moduleSuffix: '-view',
  },
  spring: {
    id: 'spring',
    label: 'Spring Boot (Java)',
    description: 'Cloud-native Java microservices with Spring Boot 3',
    architecture: 'Spring Boot 3 microservices with REST APIs, JPA repositories, and event-driven integration',
    techStack: ['Java 21', 'Spring Boot 3', 'Spring Data JPA', 'PostgreSQL', 'Kafka', 'OpenAPI'],
    tooling: ['JUnit 5', 'Testcontainers', 'SonarQube', 'Kubernetes'],
    effortMultiplier: 1.2,
    phase3Title: 'Spring Service Extraction',
    phase3Objectives: [
      'Extract bounded contexts into Spring Boot services',
      'Replace legacy DAOs with Spring Data repositories',
      'Publish OpenAPI contracts and contract tests per service',
    ],
    moduleSuffix: '-service',
  },
  dotnet: {
    id: 'dotnet',
    label: '.NET 8 / ASP.NET Core',
    description: 'Modern .NET APIs and Blazor/React front-end option',
    architecture: 'ASP.NET Core Web API with clean architecture layers and optional Blazor WASM UI',
    techStack: ['.NET 8', 'ASP.NET Core', 'Entity Framework Core', 'SQL Server/PostgreSQL', 'Minimal APIs'],
    tooling: ['xUnit', 'Playwright', 'Azure DevOps CI/CD'],
    effortMultiplier: 1.15,
    phase3Title: '.NET Service Layer Migration',
    phase3Objectives: [
      'Rebuild business logic in application/domain layers',
      'Expose minimal APIs with OpenAPI documentation',
      'Containerize services for AKS/AKS-equivalent runtime',
    ],
    moduleSuffix: '-api',
  },
  fastapi: {
    id: 'fastapi',
    label: 'Python FastAPI',
    description: 'High-performance Python APIs with async support',
    architecture: 'FastAPI services with Pydantic models, SQLAlchemy 2, and agent-ready OpenAPI surface',
    techStack: ['Python 3.12', 'FastAPI', 'Pydantic v2', 'SQLAlchemy', 'Alembic', 'Uvicorn'],
    tooling: ['pytest', 'Ruff', 'mypy', 'Docker'],
    effortMultiplier: 0.9,
    phase3Title: 'FastAPI Service Migration',
    phase3Objectives: [
      'Port legacy Python/Java glue code to FastAPI routers',
      'Model domain entities with Pydantic and SQLAlchemy',
      'Generate OpenAPI for Horizon agent harness integration',
    ],
    moduleSuffix: '-api',
  },
}

export function getMigrationTarget(id) {
  return MIGRATION_TARGETS[id] ?? MIGRATION_TARGETS.react
}

export function listMigrationTargets() {
  return Object.values(MIGRATION_TARGETS)
}

export function suggestTarget(languages = []) {
  if (languages.includes('COBOL') || languages.includes('COBOL Copybook') || languages.includes('JCL')) return 'spring'
  if (languages.includes('Java') || languages.includes('Kotlin')) return 'spring'
  if (languages.includes('C#')) return 'dotnet'
  if (languages.includes('Python')) return 'fastapi'
  if (languages.includes('React/TS') || languages.includes('TypeScript')) return 'nextjs'
  if (languages.includes('Vue')) return 'vue'
  if (languages.includes('JavaScript') || languages.includes('React')) return 'react'
  return 'react'
}
