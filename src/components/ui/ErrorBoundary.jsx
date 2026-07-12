import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#040508] p-6">
          <div className="max-w-lg w-full rounded-2xl border border-[#f08984]/40 bg-[#10141d] p-8">
            <p className="text-xs uppercase tracking-widest text-[#f08984] mb-2">Application error</p>
            <h1 className="text-lg font-semibold text-[#e8edf4] mb-3">Something prevented the UI from loading</h1>
            <p className="text-sm text-[#8b9cb0] mb-4 font-mono break-all">{this.state.error.message}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl border border-[#5ec8f2]/40 bg-[#5ec8f2]/10 text-sm text-[#5ec8f2]"
              >
                Reload page
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.clear()
                  } catch {
                    /* ignore */
                  }
                  window.location.reload()
                }}
                className="px-4 py-2 rounded-xl border border-[#8b9cb0]/30 text-sm text-[#cbd5e1]"
              >
                Clear storage &amp; reload
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
