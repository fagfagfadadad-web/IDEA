import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useEffect, Suspense } from 'react';
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
  
  useEffect(() => {
    console.log('🔄 App: Route changed to:', location.pathname);
    console.log('🔄 App: Available routes:', routes.map(r => r.path));
  }, [location]);

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
