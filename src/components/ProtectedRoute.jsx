// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Redirect to login, preserving intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <div className="bg-gym-card border border-rose-500/50 rounded-2xl p-8 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-black text-gym-text mb-2">
            Restricted to Gym Owner
          </h2>
          <p className="text-xs text-gym-muted mb-6">
            This operational area requires Owner / Administrator privileges. Your current account ({user.name}) is signed in with the <strong>{user.role}</strong> role.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-gym-surface hover:bg-gym-hover border border-gym-border text-xs font-bold text-gym-text"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
}
