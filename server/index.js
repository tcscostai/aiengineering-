import express from 'express'
import cors from 'cors'
import reRouter from './routes/reverseEngineering.js'

const app = express()
const PORT = process.env.RE_SERVER_PORT ?? 4174

app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))
app.use('/api/re', reRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/', (_req, res) => {
  const uiPort = process.env.VITE_DEV_PORT ?? '5173'
  res.type('html').send(`<!DOCTYPE html>
<html><head><title>TCS RE API</title></head>
<body style="font-family:system-ui;background:#0c0f16;color:#e8edf4;padding:2rem">
  <h1>Reverse Engineering API</h1>
  <p>This is the scanner backend only — it does not serve the TCS UI.</p>
  <p><strong>Open the app:</strong> <a href="http://localhost:${uiPort}/" style="color:#5ec8f2">http://localhost:${uiPort}/</a></p>
  <p style="color:#8b9cb0;font-size:0.9rem">API health: <a href="/api/re/health" style="color:#5ec8f2">/api/re/health</a></p>
</body></html>`)
})

const server = app.listen(PORT, () => {
  console.log(`[horizon-re] Reverse Engineering API on http://localhost:${PORT}`)
  console.log(`[horizon-re] UI is NOT here — open http://localhost:${process.env.VITE_DEV_PORT ?? '5173'}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[horizon-re] Port ${PORT} is already in use. Stop the other process or set RE_SERVER_PORT.`)
  } else {
    console.error('[horizon-re]', err.message)
  }
  process.exit(1)
})
