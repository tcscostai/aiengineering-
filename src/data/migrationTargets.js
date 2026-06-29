export const MIGRATION_TARGET_OPTIONS = [
  { id: 'react', label: 'React + TypeScript', description: 'Vite SPA, component architecture' },
  { id: 'nextjs', label: 'Next.js (React)', description: 'SSR/SSG full-stack React' },
  { id: 'angular', label: 'Angular', description: 'Enterprise Angular with RxJS' },
  { id: 'vue', label: 'Vue 3 + TypeScript', description: 'Composition API + Pinia' },
  { id: 'spring', label: 'Spring Boot (Java)', description: 'Java microservices' },
  { id: 'dotnet', label: '.NET 8 / ASP.NET Core', description: 'Modern .NET APIs' },
  { id: 'fastapi', label: 'Python FastAPI', description: 'Async Python APIs' },
]

export function suggestTargetFromLanguages(languages = []) {
  if (languages.includes('COBOL') || languages.includes('COBOL Copybook') || languages.includes('JCL')) return 'spring'
  if (languages.includes('Java') || languages.includes('Kotlin')) return 'spring'
  if (languages.includes('C#')) return 'dotnet'
  if (languages.includes('Python')) return 'fastapi'
  if (languages.includes('React/TS') || languages.includes('TypeScript')) return 'nextjs'
  if (languages.includes('Vue')) return 'vue'
  return 'react'
}
