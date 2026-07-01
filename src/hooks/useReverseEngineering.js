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
import { runMockDemoScan, createMockCopilotAnswer, getMockScanJob } from '../services/reverseEngineeringMock'
import { isDemoScanId } from '../data/demoReScanResult'
import { linkReScanToFlow } from '../services/enterpriseFlowService'
import { generateMigrationBlueprint } from '../lib/re/migrationBlueprintClient'

export function useReverseEngineering() {
  const [serverOnline, setServerOnline] = useState(false)
  const [mockMode, setMockMode] = useState(false)
  const [history, setHistory] = useState(() => getScanHistory())
  const [activeScan, setActiveScan] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [logs, setLogs] = useState([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)

  const refreshHistory = useCallback(() => setHistory(getScanHistory()), [])

  const checkServer = useCallback(async () => {
    const health = await checkReServerHealth()
    const online = !!health.ok
    setServerOnline(online)
    setMockMode(!online)
    return health
  }, [])

  const loadScanJob = useCallback(async (id) => {
    if (isDemoScanId(id)) return getMockScanJob(id)
    return fetchScan(id)
  }, [])

  useEffect(() => {
    checkServer()
    const id = getActiveScanId()
    if (id) {
      loadScanJob(id).then((job) => {
        if (job?.status === 'completed') {
          setActiveScan(job)
          if (job.logs?.length) setLogs(job.logs)
        }
      }).catch(() => {})
    }
  }, [checkServer, loadScanJob])

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
      const blueprint = job.blueprint ?? (job.result ? generateMigrationBlueprint(job.result) : null)
      const completed = { ...job, blueprint }
      setActiveScan(completed)
      persistActiveScanId(job.id ?? scanId)
      saveScanToHistory(completed)
      linkReScanToFlow(job.id ?? scanId)
      refreshHistory()
      return completed
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setScanning(false)
    }
  }, [refreshHistory])

  const scanDemo = useCallback(async (options = {}) => {
    setScanning(true)
    setError(null)
    setLogs([])
    setProgress(0)
    setMockMode(true)
    try {
      const job = await runMockDemoScan({
        ...options,
        onTick: (j) => {
          setLogs(j.logs ?? [])
          setProgress(j.progress ?? 0)
          if (j.status === 'completed') setActiveScan(j)
        },
      })
      setActiveScan(job)
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
    if (activeScan.mock || isDemoScanId(activeScan.id)) {
      return { answer: createMockCopilotAnswer(activeScan.result, question) }
    }
    return askCopilot(activeScan.id, question)
  }, [activeScan])

  return {
    serverOnline,
    mockMode,
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
    scanDemo,
    queryCopilot,
    setActiveScan,
    refreshHistory,
  }
}
