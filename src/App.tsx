import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ClusterProvider } from './contexts/ClusterContext';
import { KPIDiagnosisProvider } from './contexts/KPIDiagnosisContext';
import { BuildupProvider } from './contexts/BuildupContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { UserDocumentProvider } from './contexts/UserDocumentContext';
import { ChatProvider } from './contexts/ChatContext';
import { CalendarProvider } from './contexts/CalendarContext';
import { ApplicationProgressProvider } from './contexts/ApplicationProgressContext';
import { IndustryIntelProvider } from './contexts/IndustryIntelContext';
import { GrowthTrackingProvider } from './contexts/GrowthTrackingContext';
import { RecommendationProvider } from './contexts/RecommendationContext';
import { NotificationProvider } from './contexts/NotificationContext';
import type { UserRole } from './types';

// Development only: Calendar storage test utilities
if (import.meta.env.DEV) {
  import('./utils/testCalendarStorage').catch(console.error);
}

// Layouts
import StartupLayout from './layouts/StartupLayout';
import AdminLayout from './layouts/AdminLayout';
import PartnerLayout from './layouts/PartnerLayout';
import InternalBuilderLayout from './layouts/InternalBuilderLayout';

// Startup Pages
import StartupDashboard from './pages/startup/Dashboard';
import StartupOnboarding from './pages/startup/Onboarding';
import StartupHistory from './pages/startup/History';
import StartupSettings from './pages/startup/Settings';
import TestPage from './pages/startup/TestPage';
import KPIDiagnosisPage from './pages/startup/KPIDiagnosisPage';

// Smart Matching Pages
import SmartMatchingContainer from './pages/startup/smartMatching';
import CustomRecommendation from './pages/startup/smartMatching/tabs/CustomRecommendation';
import AllOpportunities from './pages/startup/smartMatching/tabs/AllOpportunities';

// Buildup Pages
import BuildupLayout from './pages/startup/buildup';
import BuildupDashboard from './pages/startup/buildup/BuildupDashboard';
import ServiceCatalog from './pages/startup/buildup/ServiceCatalog';
import ProjectDetail from './pages/startup/buildup/ProjectDetail';
import BuildupCalendarV3 from './pages/startup/buildup/BuildupCalendarV3';
import Cart from './pages/startup/Cart';
import CheckoutEnhanced from './pages/startup/CheckoutEnhanced';
import Messages from './pages/startup/Messages';

// New Tab Pages
import PocketMentor from './pages/startup/PocketMentor';
import PocketDay from './pages/startup/PocketDay';
import PocketBuilder from './pages/startup/PocketBuilder';
import ConnectAI from './pages/startup/ConnectAI';
import NotificationCenterPage from './pages/startup/NotificationCenter';

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
import Landing from './pages/Landing';
import LandingV2 from './pages/LandingV2';
import LandingV3 from './pages/LandingV3';
import LandingV4 from './pages/LandingV4';
// import LandingV4Enhanced from './pages/LandingV4Enhanced';
// import LandingV4Refined from './pages/LandingV4Refined';

function App() {
  // TODO: Implement auth check
  const isAuthenticated = true;
  
  // URL 파라미터로 역할 전환 (개발/데모용)
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get('role') as UserRole | null;
  const userRole: UserRole = roleParam || 'startup';
  
  // role 파라미터가 없고 루트 경로일 때만 랜딩 페이지 표시
  // startup 경로들은 role 파라미터 없어도 작동하도록 수정
  const showLanding = !roleParam && window.location.pathname === '/' && !window.location.pathname.includes('/startup');

  console.log('App rendering:', {
    isAuthenticated,
    roleParam,
    userRole,
    showLanding,
    pathname: window.location.pathname,
    search: window.location.search
  });

  if (!isAuthenticated) {
    console.log('Not authenticated, showing Login');
    return <Login />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <UserProfileProvider>
        <UserDocumentProvider>
          <ApplicationProgressProvider>
            <ClusterProvider>
              <KPIDiagnosisProvider>
                <BuildupProvider>
                  <ChatProvider>
                    <CalendarProvider>
                      <IndustryIntelProvider>
                        <GrowthTrackingProvider>
                          <RecommendationProvider>
                            <NotificationProvider>
                              <Router>
                              <Routes>
                          {/* Landing page or redirect based on role */}
                          <Route path="/" element={
                            showLanding ? <LandingV3 /> :
                            <Navigate to={
                              userRole === ('admin' as UserRole) ? '/admin/kpi-library' :
                              userRole === ('partner' as UserRole) ? '/partner/programs' :
                              userRole === ('internal-builder' as UserRole) ? '/internal-builder/dashboard' :
                              '/startup/dashboard'
                            } replace />
                          } />

                          {/* Startup Routes - MASTER_PLAN.md 기준 재구성 */}
                          <Route path="/startup" element={<StartupLayout />}>
                            <Route index element={<Navigate to="/startup/dashboard" replace />} />
                            <Route path="dashboard" element={<StartupDashboard />} />
                            <Route path="onboarding" element={<StartupOnboarding />} />
                            <Route path="test" element={<TestPage />} />

                            {/* KPI 진단 통합 페이지 (Sprint 17) */}
                            <Route path="kpi" element={<KPIDiagnosisPage />} />

                            {/* 포켓빌드업 페이지 */}
                            <Route path="buildup" element={<BuildupLayout />}>
                              <Route index element={<Navigate to="/startup/buildup/dashboard" replace />} />
                              <Route path="dashboard" element={<BuildupDashboard />} />
                              <Route path="catalog" element={<ServiceCatalog />} />
                              <Route path="project/:projectId" element={<ProjectDetail />} />
                              <Route path="calendar" element={<BuildupCalendarV3 />} />
                            </Route>
                            <Route path="matching" element={<SmartMatchingContainer />}>
                              <Route index element={<Navigate to="custom" replace />} />
                              <Route path="custom" element={<CustomRecommendation />} />
                              <Route path="all" element={<AllOpportunities />} />
                            </Route>

                            {/* 새로운 메뉴 탭들 */}
                            <Route path="mentor" element={<PocketMentor />} />
                            <Route path="pocket-day" element={<PocketDay />} />
                            <Route path="pocket-builder" element={<PocketBuilder />} />
                            <Route path="connect-ai" element={<ConnectAI />} />

                            <Route path="profile" element={<div className="p-8 text-center">VDR/마이프로필 (개발중)</div>} />
                            <Route path="cart" element={<Cart />} />
                            <Route path="checkout" element={<CheckoutEnhanced />} />
                            <Route path="messages" element={<Messages />} />
                            <Route path="notifications" element={<NotificationCenterPage />} />

                            {/* 기타 페이지 */}
                            <Route path="history" element={<StartupHistory />} />
                            <Route path="settings" element={<StartupSettings />} />

                            {/* 리다이렉션 - 기존 경로를 새 경로로 */}
                            <Route path="assessments" element={<Navigate to="/startup/kpi?tab=assess" replace />} />
                            <Route path="assessments/*" element={<Navigate to="/startup/kpi?tab=assess" replace />} />
                            <Route path="results" element={<Navigate to="/startup/kpi?tab=results" replace />} />
                            <Route path="results/*" element={<Navigate to="/startup/kpi?tab=results" replace />} />
                            <Route path="matches" element={<Navigate to="/startup/matching" replace />} />
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
                            </NotificationProvider>
                          </RecommendationProvider>
                        </GrowthTrackingProvider>
                      </IndustryIntelProvider>
                    </CalendarProvider>
                  </ChatProvider>
                </BuildupProvider>
              </KPIDiagnosisProvider>
            </ClusterProvider>
          </ApplicationProgressProvider>
        </UserDocumentProvider>
      </UserProfileProvider>
    </DndProvider>
  );
}

export default App;