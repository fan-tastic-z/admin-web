import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import LoginPage from './pages/login'
import Dashboard from './pages/dashboard'
import RolePage from './pages/roles'
import AccountPage from './pages/accounts'
import MenuPage from './pages/menus'
import OperationLogsPage from './pages/operation-logs'
import Layout from './components/layout'
import { AuthProvider } from './contexts/auth'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="roles" element={<RolePage />} />
              <Route path="accounts" element={<AccountPage />} />
              <Route path="menus" element={<MenuPage />} />
              <Route path="operation-logs" element={<OperationLogsPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
