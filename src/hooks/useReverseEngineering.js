import { useState, useCallback, useEffect } from 'react'
import {
  checkReServerHealth,
  startGitScan,
  startWorkspacePathScan,
  startWorkspaceZipScan,
  pollScanUntilDone,
  fetchScan,
  askCopilot,
} from '../services/reverseEngineeringApi'
import {
  getScanHistory,
  saveScanToHistory,
  persistActiveScanId,
  getActiveScanId,
} from '../services/reverseEngineeringService'

export function useReverseEngineering() {
  const [serverOnline, setServerOnline] = useState(false)
  const [history, setHistory] = useState(() => getScanHistory())
  const [activeScan, setActiveScan] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [logs, setLogs] = useState([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const refreshHistory = useCallback(() => setHistory(getScanHistory()), [])

  const checkServer = useCallback(async () => {
    const health = await checkReServerHealth()
    setServerOnline(!!health.ok)
    return health
  }, [])

  useEffect(() => {
    checkServer()
    const id = getActiveScanId()
    if (id) {
      fetchScan(id).then((job) => {
        if (job.status === 'completed') setActiveScan(job)
      }).catch(() => {})
    }
  }, [checkServer])

  const runScan = useCallback(async (starter) => {
    setScanning(true)
    setError(null)
    setLogs([])
    setProgress(0)
    try {
      const { scanId } = await starter()
      const job = await pollScanUntilDone(scanId, {
        onTick: (j) => {
          setLogs(j.logs ?? [])
          setProgress(j.progress ?? 0)
        },
      })
      setActiveScan(job)
      persistActiveScanId(job.id ?? scanId)
      saveScanToHistory(job)
      refreshHistory()
      return job
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setScanning(false)
    }
  }, [refreshHistory])

  const scanGit = useCallback((params) => runScan(() => startGitScan(params)), [runScan])
  const scanPath = useCallback((p) => runScan(() => startWorkspacePathScan(p)), [runScan])
  const scanZip = useCallback((file) => runScan(() => startWorkspaceZipScan(file)), [runScan])

  const queryCopilot = useCallback(async (question) => {
    if (!activeScan?.id) throw new Error('No active scan')
    return askCopilot(activeScan.id, question)
  }, [activeScan])

  return {
    serverOnline,
    checkServer,
    history,
    activeScan,
    scanning,
    logs,
    progress,
    error,
    scanGit,
    scanPath,
    scanZip,
    queryCopilot,
    setActiveScan,
    refreshHistory,
  }
}
