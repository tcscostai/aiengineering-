/** Client-side migration targets (mirrors server/data/migrationTargets.js) */
export const MIGRATION_TARGETS = {
  react: {
    id: 'react',
    label: 'React + TypeScript',
    family: 'frontend',
    description: 'Modern SPA with Vite, component architecture, and API integration layer',
    architecture: 'React 19 SPA with feature-based modules, TanStack Query data layer, and REST/GraphQL BFF',
    techStack: ['React 19', 'TypeScript', 'Vite', 'TanStack Query', 'Zustand', 'React Router', 'Tailwind CSS'],
    tooling: ['Vitest', 'Playwright', 'ESLint', 'Storybook'],
    effortMultiplier: 1.0,
    phase3Title: 'React Feature Module Migration',
    phase3Objectives: ['Re-implement UI flows as React feature modules', 'Introduce design system', 'Migrate state to hooks + store'],
    moduleSuffix: '-feature',
  },
  nextjs: {
    id: 'nextjs',
    label: 'Next.js (React)',
    family: 'frontend',
    description: 'Full-stack React with SSR/SSG, API routes, and edge-ready deployment',
    architecture: 'Next.js App Router with server components, API routes, and incremental migration via route groups',
    techStack: ['Next.js 15', 'React 19', 'TypeScript', 'Server Actions', 'Prisma', 'Tailwind CSS'],
    tooling: ['Vitest', 'Playwright', 'Vercel/AWS deployment'],
    effortMultiplier: 1.1,
    phase3Title: 'Next.js Route & API Migration',
    phase3Objectives: ['Map legacy screens to app router segments', 'Extract BFF into route handlers', 'Enable SSR for critical flows'],
    moduleSuffix: '-route',
  },
  angular: {
    id: 'angular',
    label: 'Angular',
    family: 'frontend',
    description: 'Enterprise Angular with RxJS, modules, and typed forms',
    architecture: 'Angular standalone components with feature modules, RxJS streams, and HttpClient services',
    techStack: ['Angular 19', 'TypeScript', 'RxJS', 'Angular Material', 'NgRx'],
    tooling: ['Jasmine', 'Karma', 'Playwright', 'ESLint'],
    effortMultiplier: 1.15,
    phase3Title: 'Angular Feature Module Migration',
    phase3Objectives: ['Map legacy screens to Angular feature modules', 'Introduce typed reactive forms', 'Centralize API access in services'],
    moduleSuffix: '-module',
  },
  vue: {
    id: 'vue',
    label: 'Vue 3 + TypeScript',
    family: 'frontend',
    description: 'Composition API, Pinia stores, and Vite-powered SPA',
    architecture: 'Vue 3 Composition API with Pinia state, Vue Router, and typed composables',
    techStack: ['Vue 3', 'TypeScript', 'Pinia', 'Vue Router', 'Vite', 'Vitest'],
    tooling: ['Vitest', 'Playwright', 'ESLint', 'Vue DevTools'],
    effortMultiplier: 1.05,
    phase3Title: 'Vue Feature Migration',
    phase3Objectives: ['Re-implement flows as Vue SFCs', 'Extract composables for domain logic', 'Typed API clients per module'],
    moduleSuffix: '-view',
  },
  spring: {
    id: 'spring',
    label: 'Spring Boot (Java)',
    family: 'jvm',
    description: 'Cloud-native Java microservices with Spring Boot 3',
    architecture: 'Spring Boot 3 microservices with REST APIs, JPA repositories, and event-driven integration',
    techStack: ['Java 21', 'Spring Boot 3', 'Spring Data JPA', 'PostgreSQL', 'Kafka', 'OpenAPI'],
    tooling: ['JUnit 5', 'Testcontainers', 'SonarQube', 'Kubernetes'],
    effortMultiplier: 1.2,
    phase3Title: 'Spring Service Extraction',
    phase3Objectives: ['Extract bounded contexts into Spring Boot services', 'Replace legacy DAOs with JPA', 'Publish OpenAPI per service'],
    moduleSuffix: '-service',
  },
  dotnet: {
    id: 'dotnet',
    label: '.NET 8 / ASP.NET Core',
    family: 'dotnet',
    description: 'Modern .NET minimal APIs and clean architecture',
    architecture: 'ASP.NET Core Web API with minimal APIs, EF Core, and vertical slice architecture',
    techStack: ['.NET 8', 'ASP.NET Core', 'EF Core', 'PostgreSQL', 'OpenAPI', 'MediatR'],
    tooling: ['xUnit', 'FluentAssertions', 'SonarQube', 'Azure/K8s'],
    effortMultiplier: 1.15,
    phase3Title: '.NET Service Extraction',
    phase3Objectives: ['Extract bounded contexts into ASP.NET services', 'Map legacy records to EF entities', 'Publish OpenAPI contracts'],
    moduleSuffix: '-api',
  },
  fastapi: {
    id: 'fastapi',
    label: 'Python FastAPI',
    family: 'python',
    description: 'Async Python APIs with Pydantic and OpenAPI-first design',
    architecture: 'FastAPI async services with Pydantic models, SQLAlchemy, and background tasks',
    techStack: ['Python 3.12', 'FastAPI', 'Pydantic v2', 'SQLAlchemy', 'PostgreSQL', 'Uvicorn'],
    tooling: ['pytest', 'httpx', 'Ruff', 'Docker'],
    effortMultiplier: 1.0,
    phase3Title: 'FastAPI Service Migration',
    phase3Objectives: ['Port legacy modules to FastAPI routers', 'Pydantic schemas from copybook layouts', 'Async I/O for integration calls'],
    moduleSuffix: '-service',
  },
}

export function getMigrationTarget(id) {
  return MIGRATION_TARGETS[id] ?? MIGRATION_TARGETS.react
}

export function suggestTarget(languages = []) {
  if (languages.includes('COBOL') || languages.includes('COBOL Copybook') || languages.includes('JCL')) return 'spring'
  if (languages.includes('Java') || languages.includes('Kotlin')) return 'spring'
  if (languages.includes('C#')) return 'dotnet'
  if (languages.includes('Python')) return 'fastapi'
  if (languages.includes('TypeScript') || languages.includes('React/TS')) return 'react'
  if (languages.includes('Vue')) return 'vue'
  return 'react'
}

export function getTargetFamily(targetId) {
  return getMigrationTarget(targetId).family ?? 'frontend'
}
