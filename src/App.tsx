import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import { PageNotFound } from 'pages/PageNotFound/PageNotFound';
import { routes } from 'routes';
import { Layout } from './components';

const AppContent = () => {
  return (
    <Layout>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-lg text-white">Loading...</div></div>}>
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
  );
};

export const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};