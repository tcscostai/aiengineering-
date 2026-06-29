export const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  'coverage',
  '.cache',
  '__pycache__',
  '.venv',
  'venv',
  'target',
  'bin',
  'obj',
  '.idea',
  '.vscode',
  '.gradle',
  'vendor',
])

export const CODE_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.py', '.java', '.kt', '.scala', '.go', '.rs',
  '.cs', '.cpp', '.c', '.h', '.hpp', '.rb', '.php',
  '.vue', '.svelte', '.sql', '.xml', '.yaml', '.yml',
  '.json', '.properties', '.gradle', '.md',
  '.cbl', '.cob', '.cpy', '.jcl',
])

export const MANIFEST_FILES = new Set([
  'package.json',
  'pom.xml',
  'build.gradle',
  'requirements.txt',
  'pyproject.toml',
  'Cargo.toml',
  'go.mod',
  'composer.json',
  'Gemfile',
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
])

export function shouldSkipDir(name) {
  return SKIP_DIRS.has(name) || name.startsWith('.')
}
