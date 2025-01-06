// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '@/context/AuthContext';
import { ViewModeProvider } from './context/ViewModeContext';
import { HoneycombProvider } from './context/HoneycombContext';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Settings } from '@/components/settings/Settings';
import { Profile } from '@/components/settings/Profile';
import TaskContainer from '@/components/tasks/TaskContainer/TaskContainer';
import { config } from '@/config';

const queryClient = new QueryClient();

function App() {
  const { t } = useTranslation();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ViewModeProvider>
          <HoneycombProvider>
            <Router>
              <Routes>
                {config.enableAuth && (
                  <>
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegisterForm />} />
                  </>
                )}
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
                  <Route path="/honeycomb/:id" element={<TaskContainer />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </HoneycombProvider>
        </ViewModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;