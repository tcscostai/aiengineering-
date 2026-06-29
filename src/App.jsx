import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './shell/AppShell'
import LoginPage from './pages/LoginPage'
import ExecutiveDashboard from './pages/ExecutiveDashboard'
import NewInitiative from './pages/NewInitiative'
import AgentOnboardingStudio from './pages/AgentOnboardingStudio'
import AIHarnessEngineering from './pages/AIHarnessEngineering'
import KnowledgeFabric from './pages/KnowledgeFabric'
import WorkflowDesigner from './pages/WorkflowDesigner'
import ADEngineering from './pages/ADEngineering'
import AMSEngineering from './pages/AMSEngineering'
import QEEngineering from './pages/QEEngineering'
import EvaluationCenter from './pages/EvaluationCenter'
import GovernanceCenter from './pages/GovernanceCenter'
import AgentRuntime from './pages/AgentRuntime'
import AgentMarketplace from './pages/AgentMarketplace'
import ContinuousLearning from './pages/ContinuousLearning'
import ExecutiveInsights from './pages/ExecutiveInsights'
import FinOpsCenter from './pages/FinOpsCenter'
import ReverseEngineering from './pages/ReverseEngineering'

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter basename={routerBasename || undefined}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<ExecutiveDashboard />} />
              <Route path="initiative" element={<NewInitiative />} />
              <Route path="onboarding" element={<AgentOnboardingStudio />} />
              <Route path="harness" element={<AIHarnessEngineering />} />
              <Route path="knowledge" element={<KnowledgeFabric />} />
              <Route path="workflow" element={<WorkflowDesigner />} />
              <Route path="reverse-engineering" element={<ReverseEngineering />} />
              <Route path="ad" element={<ADEngineering />} />
              <Route path="ams" element={<AMSEngineering />} />
              <Route path="qe" element={<QEEngineering />} />
              <Route path="evaluation" element={<EvaluationCenter />} />
              <Route path="governance" element={<GovernanceCenter />} />
              <Route path="finops" element={<FinOpsCenter />} />
              <Route path="runtime" element={<AgentRuntime />} />
              <Route path="marketplace" element={<AgentMarketplace />} />
              <Route path="learning" element={<ContinuousLearning />} />
              <Route path="insights" element={<ExecutiveInsights />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  )
}
