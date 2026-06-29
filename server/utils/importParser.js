const IMPORT_PATTERNS = {
  js: [
    /import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  py: [
    /^from\s+([\w.]+)\s+import/gm,
    /^import\s+([\w.]+)/gm,
  ],
  java: [
    /^import\s+(?:static\s+)?([\w.]+(?:\.\*)?)\s*;/gm,
  ],
  go: [
    /^\s*"([^"]+)"/gm,
  ],
  cobol: [
    /\bCOPY\s+['"]?([A-Z0-9\-]+)['"]?/gi,
    /\bCALL\s+['"]?([A-Z0-9\-]+)['"]?/gi,
    /\bEXEC\s+SQL\s+INCLUDE\s+([A-Z0-9\-]+)/gi,
  ],
}

function getLang(ext) {
  if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext)) return 'js'
  if (ext === '.py') return 'py'
  if (ext === '.java' || ext === '.kt') return 'java'
  if (ext === '.go') return 'go'
  if (['.cbl', '.cob', '.cpy', '.jcl'].includes(ext)) return 'cobol'
  return null
}

function extractRawImports(content, ext) {
  const lang = getLang(ext)
  if (!lang || !content) return []
  const imports = []
  for (const pattern of IMPORT_PATTERNS[lang]) {
    const re = new RegExp(pattern.source, pattern.flags)
    let match
    while ((match = re.exec(content)) !== null) {
      const imp = match[1]?.trim()
      if (imp && imp.length < 160) imports.push(imp)
    }
  }
  return imports
}

export function extractImports(content, ext) {
  const raw = extractRawImports(content, ext)
  if (['.cbl', '.cob', '.cpy', '.jcl'].includes(ext)) {
    return raw
      .filter((imp) => imp.startsWith('WS-') || imp.startsWith('DB2') || imp.startsWith('IMS'))
      .map((imp) => imp.split('-')[0])
  }
  return raw
    .filter((imp) => !imp.startsWith('.') && !imp.startsWith('/'))
    .map((imp) => imp.split('/')[0].split('.')[0])
    .filter(Boolean)
}

export function extractInternalImports(content, ext) {
  const raw = extractRawImports(content, ext)
  if (['.cbl', '.cob', '.cpy', '.jcl'].includes(ext)) {
    return raw.filter((imp) => !imp.startsWith('WS-') && !imp.startsWith('DB2'))
  }
  return raw.filter((imp) => imp.startsWith('.') || imp.startsWith('/'))
}

export function detectSecurityFindings(content, filePath) {
  const findings = []
  if (!content) return findings

  const rules = [
    { pattern: /\beval\s*\(/, type: 'security_hotspot', severity: 'high', label: 'eval() usage' },
    { pattern: /password\s*=\s*['"][^'"]+['"]/i, type: 'security_hotspot', severity: 'critical', label: 'Hardcoded password' },
    { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/i, type: 'security_hotspot', severity: 'critical', label: 'Hardcoded API key' },
    { pattern: /BEGIN (RSA |OPENSSH )?PRIVATE KEY/, type: 'security_hotspot', severity: 'critical', label: 'Private key in source' },
    { pattern: /TODO|FIXME|HACK/, type: 'code_smell', severity: 'low', label: 'Unresolved TODO/FIXME' },
    { pattern: /System\.out\.print/, type: 'code_smell', severity: 'low', label: 'Debug print statement' },
    { pattern: /console\.log\(/, type: 'code_smell', severity: 'low', label: 'Console log in source' },
    { pattern: /@Deprecated/, type: 'api_deprecation', severity: 'medium', label: 'Deprecated API usage' },
  ]

  const lines = content.split('\n')
  for (const rule of rules) {
    lines.forEach((line, idx) => {
      if (rule.pattern.test(line)) {
        findings.push({
          id: `${filePath}:${idx + 1}:${rule.label}`,
          type: rule.type,
          severity: rule.severity,
          label: rule.label,
          file: filePath,
          line: idx + 1,
          snippet: line.trim().slice(0, 120),
        })
      }
    })
  }
  return findings
}
