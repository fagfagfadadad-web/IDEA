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
    { id: 0, label: 'Statistics', component: AdminStats, icon: <BarChart3 size={16} />, emoji: '📊' },
    { id: 1, label: 'Task Management', component: AdminTasks, icon: <Target size={16} />, emoji: '🎯' },
    { id: 2, label: 'User Management', component: AdminUsers, icon: <Users size={16} />, emoji: '👥' },
    { id: 3, label: 'System Settings', component: () => <div className="p-8 text-gray-700 font-inter">System settings coming soon...</div>, icon: <Settings size={16} />, emoji: '⚙️' }
  ];

  // Show loading while auth is still loading
  if (authLoading) {
    return (
      <div className="page-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-400 mx-auto"></div>
          <div className="text-xl text-primary-600 font-inter font-bold">Loading Authentication...</div>
        </div>
      </div>
    );
  }

  // Show access denied if not logged in
  if (!user) {
    return (
      <div className="page-bg">
        <div className="container mx-auto px-6 py-8">
          <div className="cute-card p-8 text-center border-red-400 bg-red-50">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-inter font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-700 font-inter">Please log in to access the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (!user.isAdmin) {
    return (
      <div className="page-bg">
        <div className="container mx-auto px-6 py-8">
          <div className="cute-card p-8 text-center border-red-400 bg-red-50">
            <div className="text-red-500 text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-inter font-bold text-red-600 mb-4">Admin Access Required</h2>
            <p className="text-gray-700 font-inter">You need administrator privileges to access this panel.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg font-inter">
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="title-responsive font-inter font-bold gradient-text">
              Admin Control Center
            </h1>
            <p className="text-gray-700 text-lg font-inter">
              Manage the PupFi pet care ecosystem
            </p>
            <div className="cute-card p-4 max-w-md mx-auto border-success bg-green-50">
              <div className="flex items-center justify-center gap-2">
                <span className="text-success text-2xl">✅</span>
                <span className="text-gray-800 font-inter font-bold">Admin Access Granted</span>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="cute-card overflow-hidden">
            <div className="flex flex-wrap border-b border-primary-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[150px] px-6 py-4 font-inter font-bold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-200 to-primary-300 text-primary-700 border-b-2 border-primary-500'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{tab.emoji}</span>
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