import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Sparkles, FileCode } from 'lucide-react'
import { GlassPanel } from '../ui/GlassPanel'

const SUGGESTIONS = [
  'Give me an overview of this codebase',
  'What are the top migration risks?',
  'Which modules should we extract first?',
  'Propose a phased migration roadmap',
]

export function ReverseEngineerCopilot({ activeScan, onAsk, disabled }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const handleAsk = async (q) => {
    const text = (q ?? question).trim()
    if (!text || !activeScan) return
    setQuestion('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      const res = await onAsk(text)
      setMessages((m) => [...m, { role: 'assistant', content: res.answer, evidence: res.evidence, confidence: res.confidence }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', content: err.message, error: true }])
    } finally {
      setLoading(false)
    }
  }

  if (!activeScan?.result) {
    return (
      <GlassPanel className="p-12 text-center">
        <Bot className="w-10 h-10 text-cx-fg-dim mx-auto mb-3" />
        <p className="text-sm text-cx-fg-dim">Complete a scan to unlock the AI Reverse Engineer copilot.</p>
      </GlassPanel>
    )
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      <GlassPanel className="flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 text-cx-accent mx-auto mb-2" />
              <p className="text-sm text-cx-fg-muted">Ask anything about architecture, risks, or migration — grounded in your scan.</p>
            </div>
          )}
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-cx-accent/15 text-cx-fg border border-cx-accent/25'
                      : msg.error
                        ? 'bg-cx-danger/10 text-cx-danger border border-cx-danger/20'
                        : 'bg-cx-panel border border-cx-border text-cx-fg-muted'
                  }`}
                >
                  {msg.content}
                  {msg.evidence?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-cx-border space-y-1">
                      <p className="text-2xs uppercase text-cx-fg-dim">Evidence</p>
                      {msg.evidence.map((ev, j) => (
                        <div key={j} className="flex items-center gap-1.5 text-2xs font-mono text-cx-accent">
                          <FileCode className="w-3 h-3" />
                          {ev.file ? `${ev.file}:${ev.line}` : ev.path ?? ev.label}
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.confidence != null && (
                    <p className="text-2xs text-cx-fg-dim mt-2">Confidence {(msg.confidence * 100).toFixed(0)}%</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div className="text-xs text-cx-fg-dim animate-pulse">Analyzing codebase context…</div>
          )}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); handleAsk() }}
          className="p-3 border-t border-cx-border flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={disabled || loading}
            placeholder="Explain the auth flow, list risks, propose extraction order…"
            className="flex-1 px-3 py-2 rounded-xl border border-cx-border bg-cx-panel/50 text-sm text-cx-fg focus:outline-none focus:border-cx-accent/40"
          />
          <button type="submit" disabled={disabled || loading} className="p-2.5 rounded-xl border border-cx-accent/40 bg-cx-accent/10 text-cx-accent disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </GlassPanel>

      <div className="space-y-3">
        <GlassPanel className="p-4">
          <p className="text-2xs uppercase tracking-widest text-cx-fg-dim mb-2">Suggested prompts</p>
          <div className="space-y-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleAsk(s)}
                disabled={loading}
                className="w-full text-left text-xs p-2.5 rounded-lg border border-cx-border hover:border-cx-accent/30 text-cx-fg-dim hover:text-cx-accent transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel className="p-4 text-xs text-cx-fg-dim">
          <p className="font-medium text-cx-fg-muted mb-1">Source</p>
          <p className="font-mono text-2xs break-all">{activeScan.result.sourceLabel}</p>
          <p className="mt-2">{activeScan.result.stats.totalFiles} files · {activeScan.result.stats.languages.join(', ')}</p>
        </GlassPanel>
      </div>
    </div>
  )
}
