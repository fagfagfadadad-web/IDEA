import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageNotFound } from 'pages/PageNotFound/PageNotFound';
import { routes } from 'routes';
import { BatchTransactionsContextProvider } from 'wrappers';
import { AuthProvider } from './context/AuthContext';
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
      </Layout>
      <MobileBottomNav />
    </>
  );
};

export const App = () => {

  return (
    <Router>
      <AuthProvider>
        <BatchTransactionsContextProvider>
          <AppContent />
        </BatchTransactionsContextProvider>
      </AuthProvider>
    </Router>
  );
};
