import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { PageNotFound } from 'pages/PageNotFound/PageNotFound';
import { routes } from 'routes';
import { BatchTransactionsContextProvider } from 'wrappers';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { GameProvider } from './context/GameContext';
import { SettingsProvider } from './context/SettingsContext';
import { Layout } from './components';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

const AppContent = () => {
  const location = useLocation();

  useEffect(() => {
    console.log('🔄 App: Route changed to:', location.pathname);
    console.log('🔄 App: Available routes:', routes.map(r => r.path));

    // Scroll to top on route change
    window.scrollTo(0, 0);

    // Capture referral code from URL and store in localStorage
    const urlParams = new URLSearchParams(location.search);
    const referralCode = urlParams.get('ref');
    if (referralCode) {
      console.log('🔗 App: Storing referral code:', referralCode);
      localStorage.setItem('pendingReferralCode', referralCode);
    }
  }, [location]);

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Layout>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-slate-900">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
              <div className="text-lg text-cyan-400 font-orbitron">Loading PupFi...</div>
            </div>
          </div>
        }>
          <Routes>
            {routes.map((route) => (
              <Route
                key={`route-key-${route.path}`}
                path={route.path}
                element={<route.component />}
              >
                {route.children?.map((child) => (
                  <Route
                    key={`route-key-${route.path}-${child.path}`}
                    path={child.path}
                    element={<child.component />}
                  />
                ))}
              </Route>
            ))}
            <Route path='*' element={<PageNotFound />} />
          </Routes>
        </Suspense>
      </Layout>
      <MobileBottomNav />
    </div>
  );
};

export const App = () => {
  return (
    <Router>
      <ToastProvider>
        <SettingsProvider>
          <AuthProvider>
            <GameProvider>
              <BatchTransactionsContextProvider>
                <AppContent />
              </BatchTransactionsContextProvider>
            </GameProvider>
          </AuthProvider>
        </SettingsProvider>
      </ToastProvider>
    </Router>
  );
};