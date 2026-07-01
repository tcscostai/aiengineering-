import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, FolderOpen, Upload, Play, Server, AlertTriangle } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'
import { ProgressBar } from '../ui/ProgressBar'

const inputClass =
  'w-full px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm text-cx-fg placeholder:text-cx-fg-dim focus:outline-none focus:border-cx-accent/40 font-mono'

const DEMO_COBOL_PATH = '/Users/saurabhdubey/AI Engineering/horizon-ai-engineering/demo-workspaces/legacy-claims-cobol'

const SAMPLE_REPOS = [
  { label: 'COBOL Claims (legacy)', localPath: DEMO_COBOL_PATH },
  { label: 'Horizon (this app)', localPath: '/Users/saurabhdubey/AI Engineering/horizon-ai-engineering' },
  { label: 'React (public)', url: 'https://github.com/facebook/react.git', branch: 'main' },
  { label: 'Vite', url: 'https://github.com/vitejs/vite.git', branch: 'main' },
]

export function ScanSourcePanel({
  serverOnline,
  scanning,
  progress,
  onScanGit,
  onScanPath,
  onScanZip,
  onScanDemo,
  onCheckServer,
}) {
  const [source, setSource] = useState('git')
  const [gitForm, setGitForm] = useState({ url: '', branch: 'main', token: '', subpath: '' })
  const [localPath, setLocalPath] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleGitSubmit = (e) => {
    e.preventDefault()
    onScanGit(gitForm)
  }

  const handlePathSubmit = (e) => {
    e.preventDefault()
    const cleaned = localPath.trim().replace(/^['"`]+|['"`]+$/g, '')
    onScanPath(cleaned)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.name?.toLowerCase().endsWith('.zip')) onScanZip(file)
  }, [onScanZip])

  return (
    <div className="space-y-4">
      {!serverOnline && (
        <GlassPanel className="p-4 border-cx-warn/30 bg-cx-warn/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-cx-warn shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-cx-fg">Reverse Engineering API offline — client-side analysis available</p>
              <p className="text-xs text-cx-fg-dim mt-1">
                Scan the bundled legacy COBOL claims workspace below. For live Git clone scans use{' '}
                <code className="text-cx-accent">npm run dev:full</code>.
              </p>
              <button
                type="button"
                onClick={onScanDemo}
                disabled={scanning}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-xs hover:bg-cx-accent/20 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                Scan Legacy COBOL Claims Workspace
              </button>
              <button onClick={onCheckServer} className="mt-2 ml-3 text-xs text-cx-fg-dim hover:underline">Retry API</button>
            </div>
          </div>
        </GlassPanel>
      )}

      <div className="flex flex-wrap gap-1 p-1 rounded-xl border border-cx-border bg-cx-panel/50 w-fit">
        {[
          { id: 'git', label: 'Git Repository', icon: GitBranch },
          { id: 'path', label: 'Local Path', icon: FolderOpen },
          { id: 'zip', label: 'Upload ZIP', icon: Upload },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSource(t.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
              source === t.id ? 'bg-cx-accent/15 text-cx-accent border border-cx-accent/30' : 'text-cx-fg-dim hover:text-cx-fg-muted'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {source === 'git' && (
        <GlassPanel hero className="p-5">
          <form onSubmit={handleGitSubmit} className="space-y-3">
            <div>
              <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1 block">Repository URL *</label>
              <input className={inputClass} value={gitForm.url} onChange={(e) => setGitForm({ ...gitForm, url: e.target.value })} placeholder="https://github.com/org/repo.git" required />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1 block">Branch</label>
                <input className={inputClass} value={gitForm.branch} onChange={(e) => setGitForm({ ...gitForm, branch: e.target.value })} />
              </div>
              <div>
                <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1 block">Subpath (monorepo)</label>
                <input className={inputClass} value={gitForm.subpath} onChange={(e) => setGitForm({ ...gitForm, subpath: e.target.value })} placeholder="packages/api" />
              </div>
              <div>
                <label className="text-2xs uppercase text-cx-fg-dim tracking-widest mb-1 block">Token (private)</label>
                <input className={inputClass} type="password" value={gitForm.token} onChange={(e) => setGitForm({ ...gitForm, token: e.target.value })} placeholder="ghp_…" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_REPOS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    if (s.localPath) {
                      setSource('path')
                      setLocalPath(s.localPath)
                    } else {
                      setGitForm((f) => ({ ...f, url: s.url, branch: s.branch }))
                      setSource('git')
                    }
                  }}
                  className="text-2xs px-2.5 py-1 rounded-lg border border-cx-border text-cx-fg-dim hover:border-cx-accent/30 hover:text-cx-accent"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={scanning || !serverOnline}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm hover:bg-cx-accent/20 disabled:opacity-40"
            >
              <Play className="w-4 h-4" /> Clone & Analyze
            </button>
          </form>
        </GlassPanel>
      )}

      {source === 'path' && (
        <GlassPanel hero className="p-5">
          <form onSubmit={handlePathSubmit} className="space-y-3">
            <p className="text-xs text-cx-fg-dim">Absolute path on the machine running the RE API server. Paste without quotes, e.g. <code className="text-cx-accent">/Users/you/Aurexis AI</code></p>
            <input className={inputClass} value={localPath} onChange={(e) => setLocalPath(e.target.value)} placeholder="/Users/you/projects/legacy-app" required />
            <button type="submit" disabled={scanning || !serverOnline} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent text-sm disabled:opacity-40">
              <Server className="w-4 h-4" /> Scan Workspace
            </button>
          </form>
        </GlassPanel>
      )}

      {source === 'zip' && (
        <GlassPanel hero className="p-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              dragOver ? 'border-cx-accent bg-cx-accent/5' : 'border-cx-border'
            }`}
          >
            <Upload className="w-8 h-8 text-cx-fg-dim mx-auto mb-3" />
            <p className="text-sm text-cx-fg-muted">Drop a ZIP of your workspace here</p>
            <p className="text-xs text-cx-fg-dim mt-1">or choose a file (max 200MB)</p>
            <input
              type="file"
              accept=".zip"
              className="mt-4 text-xs text-cx-fg-dim"
              disabled={scanning || !serverOnline}
              onChange={(e) => e.target.files?.[0] && onScanZip(e.target.files[0])}
            />
          </div>
        </GlassPanel>
      )}

      {scanning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <ProgressBar value={progress} label="Scan progress" showPercent />
        </motion.div>
      )}
    </div>
  )
}
