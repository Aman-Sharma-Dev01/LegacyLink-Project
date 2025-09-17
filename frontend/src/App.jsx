import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { FaComments } from "react-icons/fa";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Components
import Chat from "./components/Chat";

function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 relative">
          {/* Normal routes */}
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
          </Routes>

          {/* Floating Chat Icon */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            <FaComments size={24} />
          </button>

          {/* Chat Window */}
          {showChat && (
            <div className="fixed bottom-20 right-6 w-80 h-96 bg-white shadow-xl rounded-lg border flex flex-col">
              <div className="p-3 bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
                <h2 className="font-bold">Chatbot</h2>
                <button onClick={() => setShowChat(false)} className="text-sm">
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
    </AuthProvider>
  );
}

export default App;
