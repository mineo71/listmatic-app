// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Settings } from '@/components/settings/Settings';
import { Profile } from '@/components/settings/Profile';
import { HoneycombViewWrapper } from '@/components/hive/HoneycombViewWrapper';
import { config } from '@/config';
import './i18n/config';
import './index.css';
import { Toaster } from 'react-hot-toast';
import { SharedCanvasView } from './components/honeycomb/SharedCanvasView';

const queryClient = new QueryClient();

function App() {
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
                <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                <Route path="/share/:shareCode" element={<SharedCanvasView />} />
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
              <Route index element={<EmptyState />} />
              <Route path="honeycomb/:id" element={<HoneycombViewWrapper />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;