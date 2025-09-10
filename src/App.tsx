import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClusterProvider } from './contexts/ClusterContext';
import type { UserRole } from './types';

// Layouts
import StartupLayout from './layouts/StartupLayout';
import AdminLayout from './layouts/AdminLayout';
import PartnerLayout from './layouts/PartnerLayout';
import InternalBuilderLayout from './layouts/InternalBuilderLayout';

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
            userRole === ('internal-builder' as UserRole) ? '/internal-builder/dashboard' :
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

        {/* Partner Routes (외부 빌더) */}
        <Route path="/partner" element={<PartnerLayout />}>
          <Route path="programs" element={<PartnerPrograms />} />
          <Route path="candidates" element={<PartnerCandidates />} />
        </Route>

        {/* Internal Builder Routes (내부 빌더) */}
        <Route path="/internal-builder" element={<InternalBuilderLayout />}>
          <Route path="dashboard" element={<div className="p-8"><h2 className="text-2xl font-bold">내부 빌더 대시보드</h2></div>} />
          <Route path="startups" element={<div className="p-8"><h2 className="text-2xl font-bold">담당 스타트업 관리</h2></div>} />
          <Route path="programs" element={<div className="p-8"><h2 className="text-2xl font-bold">빌드업 프로그램</h2></div>} />
          <Route path="matching" element={<div className="p-8"><h2 className="text-2xl font-bold">스마트 매칭</h2></div>} />
          <Route path="analytics" element={<div className="p-8"><h2 className="text-2xl font-bold">성과 분석</h2></div>} />
          <Route path="reports" element={<div className="p-8"><h2 className="text-2xl font-bold">리포트</h2></div>} />
          <Route path="resources" element={<div className="p-8"><h2 className="text-2xl font-bold">내부 자료실</h2></div>} />
          <Route path="settings" element={<div className="p-8"><h2 className="text-2xl font-bold">설정</h2></div>} />
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