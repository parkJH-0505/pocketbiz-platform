import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClusterProvider } from './contexts/ClusterContext';
import type { UserRole } from './types';

// Layouts
import StartupLayout from './layouts/StartupLayout';
import AdminLayout from './layouts/AdminLayout';
import PartnerLayout from './layouts/PartnerLayout';

// Startup Pages
import StartupDashboard from './pages/startup/Dashboard';
import StartupOnboarding from './pages/startup/Onboarding';
import StartupAssessments from './pages/startup/Assessments';
import StartupResults from './pages/startup/Results';
import StartupMatches from './pages/startup/Matches';
import StartupHistory from './pages/startup/History';
import StartupSettings from './pages/startup/Settings';
import TestPage from './pages/startup/TestPage';

// Admin Pages
import AdminKPILibrary from './pages/admin/KPILibrary';
import AdminWeighting from './pages/admin/Weighting';
import AdminScoring from './pages/admin/Scoring';
import AdminPrograms from './pages/admin/Programs';
import AdminMatchRules from './pages/admin/MatchRules';
import AdminQuality from './pages/admin/Quality';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';

// Partner Pages
import PartnerPrograms from './pages/partner/Programs';
import PartnerCandidates from './pages/partner/Candidates';

// Auth
import Login from './pages/Login';

function App() {
  // TODO: Implement auth check
  const isAuthenticated = true;
  
  // URL 파라미터로 역할 전환 (개발/데모용)
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get('role') as UserRole;
  const userRole: UserRole = roleParam || 'startup';

  return (
    <ClusterProvider>
      {!isAuthenticated ? (
        <Login />
      ) : (
      <Router>
        <Routes>
        {/* Root redirect based on role */}
        <Route path="/" element={
          <Navigate to={
            userRole === ('admin' as UserRole) ? '/admin/kpi-library' :
            userRole === ('partner' as UserRole) ? '/partner/programs' :
            '/startup/dashboard'
          } replace />
        } />

        {/* Startup Routes */}
        <Route path="/startup" element={<StartupLayout />}>
          <Route path="dashboard" element={<StartupDashboard />} />
          <Route path="onboarding" element={<StartupOnboarding />} />
          <Route path="test" element={<TestPage />} />
          <Route path="assessments" element={<StartupAssessments />} />
          <Route path="assessments/new" element={<div>New Assessment</div>} />
          <Route path="assessments/:runId" element={<div>Assessment Detail</div>} />
          <Route path="results" element={<StartupResults />} />
          <Route path="results/:runId" element={<div>Result Detail</div>} />
          <Route path="matches" element={<StartupMatches />} />
          <Route path="history" element={<StartupHistory />} />
          <Route path="settings" element={<StartupSettings />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="kpi-library" element={<AdminKPILibrary />} />
          <Route path="weighting" element={<AdminWeighting />} />
          <Route path="scoring" element={<AdminScoring />} />
          <Route path="programs" element={<AdminPrograms />} />
          <Route path="match-rules" element={<AdminMatchRules />} />
          <Route path="quality" element={<AdminQuality />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Partner Routes */}
        <Route path="/partner" element={<PartnerLayout />}>
          <Route path="programs" element={<PartnerPrograms />} />
          <Route path="candidates" element={<PartnerCandidates />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div className="p-8 text-center">페이지를 찾을 수 없습니다.</div>} />
      </Routes>
    </Router>
      )}
    </ClusterProvider>
  );
}

export default App;