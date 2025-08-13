import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useEffect, Suspense, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { PageNotFound } from 'pages/PageNotFound/PageNotFound';
import { routes } from 'routes';
import { BatchTransactionsContextProvider } from 'wrappers';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

const AppContent = () => {
  const location = useLocation();
  const hasProcessedReferral = useRef(false);
  
  useEffect(() => {
  }, [location]);

  // Capture referral code from URL on initial load
  useEffect(() => {
    if (hasProcessedReferral.current) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      localStorage.setItem('pendingReferralCode', referralCode);
      
      // Clean the URL to remove the referral parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('ref');
      window.history.replaceState({}, '', newUrl.toString());
      
    }
    
    hasProcessedReferral.current = true;
  }, []);

  return (
    <>
      <Layout>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>}>
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
    </>
  );
};

export const App = () => {

  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <BatchTransactionsContextProvider>
            <AppContent />
          </BatchTransactionsContextProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
};
