import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProgressProvider } from './context/ProgressContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import QuizPage from './pages/QuizPage';
import ProfilePage from './pages/ProfilePage';
import AdminPanel from './pages/AdminPanel';
import StatsPage from './pages/StatsPage';
import FAQPage from './pages/FAQPage';
import SettingsPage from './pages/SettingsPage';
import InstallPWA from './components/InstallPWA';

import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <SettingsProvider>
          <ProgressProvider>
            <ThemeProvider>
              <InstallPWA />
              <Router>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />

                  <Route path="/" element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/quiz" element={
                    <ProtectedRoute>
                      <Layout>
                        <QuizPage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Layout>
                        <ProfilePage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/stats" element={
                    <ProtectedRoute>
                      <Layout>
                        <StatsPage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/faq" element={
                    <ProtectedRoute>
                      <Layout>
                        <FAQPage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Layout>
                        <SettingsPage />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/admin" element={
                    <ProtectedRoute adminOnly={true}>
                      <Layout>
                        <AdminPanel />
                      </Layout>
                    </ProtectedRoute>
                  } />

                  <Route path="/swagger" element={<Navigate to="/swagger.html" replace />} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
            </ThemeProvider>
          </ProgressProvider>
        </SettingsProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;
