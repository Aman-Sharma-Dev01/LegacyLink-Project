import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SocketProvider } from "./contexts/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { FaComments } from "react-icons/fa";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

// Loading component for lazy loaded pages
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-linkedin-blue"></div>
  </div>
);

// Lazy loaded pages for better performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const AlumniDirectoryPage = lazy(() => import("./pages/AlumniDirectoryPage"));
const NotificationsPage = lazy(() => import("./components/Notifications"));
const ConnectionsPage = lazy(() => import("./pages/ConnectionsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

// Components
import Chat from "./components/Chat";

function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-slate-900 relative transition-colors">
            <Suspense fallback={<LoadingSpinner />}>
            {/* Normal routes */}
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="Institute_Admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requiredRole="Institute_Admin">
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alumni-directory"
                element={
                  <ProtectedRoute>
                    <AlumniDirectoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connections"
                element={
                  <ProtectedRoute>
                    <ConnectionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Routes>
            </Suspense>

          {/* PWA Install Prompt */}
          <PWAInstallPrompt />

          {/* Floating Chat Icon */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition z-50"
            aria-label="Open chat"
          >
            <FaComments size={24} />
          </button>

          {/* Chat Window */}
          {showChat && (
            <div className="fixed bottom-20 right-6 w-80 h-96 bg-white shadow-xl rounded-lg border flex flex-col z-50">
              <div className="p-3 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
                <h2 className="font-bold">Chatbot</h2>
                <button onClick={() => setShowChat(false)} className="text-sm" aria-label="Close chat">
                  ✖
                </button>
              </div>
              <div className="flex-1 p-2 overflow-hidden">
                <Chat />
              </div>
            </div>
          )}
        </div>
      </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
