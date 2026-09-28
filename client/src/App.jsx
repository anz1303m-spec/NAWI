import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SkeletonDashboard } from './components/SkeletonLoader';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const NewTestPage = lazy(() => import('./pages/NewTestPage'));
const TestPlanPage = lazy(() => import('./pages/TestPlanPage'));
const TestExecutionPage = lazy(() => import('./pages/TestExecutionPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const ReportSummaryPage = lazy(() => import('./pages/ReportSummaryPage'));
const ReportDetailedPage = lazy(() => import('./pages/ReportDetailedPage'));
const CertificatePage = lazy(() => import('./pages/CertificatePage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const ViewerDashboardPage = lazy(() => import('./pages/ViewerDashboardPage'));
const PublicVerifyPage = lazy(() => import('./pages/PublicVerifyPage'));

function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F4F0E8] p-8">
                <SkeletonDashboard />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/home" replace />;
    }

    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Suspense fallback={
                    <div className="min-h-screen bg-[#F4F0E8] p-8">
                        <SkeletonDashboard />
                    </div>
                }>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />

                        {/* PUBLIC UNPROTECTED QR & MANUAL VERIFICATION ROUTES */}
                        <Route path="/verify" element={<PublicVerifyPage />} />
                        <Route path="/verify/:reportId" element={<PublicVerifyPage />} />

                        <Route path="/home" element={
                            <ProtectedRoute>
                                <HomePage />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/viewer" element={
                            <ProtectedRoute>
                                <ViewerDashboardPage />
                            </ProtectedRoute>
                        } />
                        
                        <Route path="/new-test" element={
                            <ProtectedRoute>
                                <NewTestPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/test-plan" element={
                            <ProtectedRoute>
                                <TestPlanPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/tests" element={
                            <ProtectedRoute>
                                <TestExecutionPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/history" element={
                            <ProtectedRoute>
                                <HistoryPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/report/:id" element={
                            <ProtectedRoute>
                                <ReportSummaryPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/report-detailed/:id" element={
                            <ProtectedRoute>
                                <ReportDetailedPage />
                            </ProtectedRoute>
                        } />

                        <Route path="/certificate/:id" element={<CertificatePage />} />

                        <Route path="/admin" element={
                            <ProtectedRoute adminOnly={true}>
                                <AdminDashboardPage />
                            </ProtectedRoute>
                        } />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </Router>
        </AuthProvider>
    );
}

