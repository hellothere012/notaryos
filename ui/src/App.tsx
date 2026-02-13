import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppHeader } from './components/layout/AppHeader';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { VerifyPanel } from './components/verification/VerifyPanel';
import { ProfilePage } from './components/account/ProfilePage';
import { SettingsPage } from './components/account/SettingsPage';
import { ApiKeysPage } from './components/apikeys/ApiKeysPage';
import { HistoryPage } from './components/history/HistoryPage';
import { AdminPage } from './components/admin/AdminPage';
import { LandingPage } from './components/landing/LandingPage';
import { AboutPage } from './components/about/AboutPage';
import { PricingPage } from './components/pricing/PricingPage';
import { DocsPage } from './components/docs/DocsPage';
import PublicVerifyPage from './components/verification/PublicVerifyPage';

/**
 * Layout wrapper that shows header/sidebar for app pages
 * but not for landing page or auth pages
 */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Landing page, about page, pricing page, docs page, and public receipt pages have their own layout
  if (location.pathname === '/' || location.pathname === '/about' || location.pathname === '/pricing' || location.pathname === '/docs' || location.pathname.startsWith('/r/')) {
    return <>{children}</>;
  }

  // Auth pages: no sidebar, just centered content
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center p-6">
          {children}
        </main>
        <Footer />
      </div>
    );
  }

  // App pages: full layout with sidebar
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public routes */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/verify" element={<VerifyPanel />} />
            <Route path="/r/:hash" element={<PublicVerifyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected routes */}
            <Route path="/history" element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } />
            <Route path="/api-keys" element={
              <ProtectedRoute>
                <ApiKeysPage />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPage />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
