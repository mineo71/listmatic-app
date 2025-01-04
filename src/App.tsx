// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Settings } from '@/components/settings/Settings';
import { Profile } from '@/components/settings/Profile';
import { HoneycombViewWrapper } from '@/components/hive/HoneycombViewWrapper';
import { config } from '@/config';
import './i18n/config';
import './index.css';

const queryClient = new QueryClient();

function App() {
  const { t } = useTranslation();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth routes */}
            {config.enableAuth && (
              <>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
              </>
            )}

            {/* Protected routes */}
            <Route
              path="/"
              element={
                config.enableAuth ? (
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                ) : (
                  <Layout />
                )
              }
            >
              <Route index element={
                <div className="p-6 text-gray-500 text-center">
                  {t('messages.selectHoneycomb')}
                </div>
              } />
              <Route path="honeycomb/:id" element={<HoneycombViewWrapper />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;