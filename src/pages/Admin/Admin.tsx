import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminTasks } from '../../components/AdminTasks';
import { AdminStats } from '../../components/AdminStats';
import { AdminUsers } from '../../components/AdminUsers';
import { Settings, BarChart3, Users, Target } from 'lucide-react';

export const Admin: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 0, label: 'Statistics', component: AdminStats, icon: <BarChart3 size={16} /> },
    { id: 1, label: 'Task Management', component: AdminTasks, icon: <Target size={16} /> },
    { id: 2, label: 'User Management', component: AdminUsers, icon: <Users size={16} /> },
    { id: 3, label: 'System Settings', component: () => <div className="p-8 text-white">System settings coming soon...</div>, icon: <Settings size={16} /> }
  ];

  // Show loading while auth is still loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto"></div>
          <div className="text-xl text-cyan-400 font-orbitron">Loading Authentication...</div>
        </div>
      </div>
    );
  }

  // Show access denied if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-red-900/50 backdrop-blur-lg border border-red-500/50 rounded-xl p-8 text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-orbitron font-bold text-white mb-4">Access Denied</h2>
            <p className="text-gray-300">Please log in to access the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!user.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        <div className="container mx-auto px-6 py-8">
          <div className="bg-red-900/50 backdrop-blur-lg border border-red-500/50 rounded-xl p-8 text-center">
            <div className="text-red-400 text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-orbitron font-bold text-white mb-4">Admin Access Required</h2>
            <p className="text-gray-300">You need administrator privileges to access this panel.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Admin Control Center
            </h1>
            <p className="text-gray-400 text-lg">
              Manage the ZEN Mining ecosystem
            </p>
            <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center gap-2">
                <span className="text-green-400 text-2xl">✅</span>
                <span className="text-white font-medium">Admin Access Granted</span>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-cyan-500/20 overflow-hidden">
            <div className="flex flex-wrap border-b border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[150px] px-6 py-4 font-orbitron font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border-b-2 border-cyan-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {tab.icon}
                    {tab.label}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6">
              {React.createElement(tabs[activeTab].component)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};