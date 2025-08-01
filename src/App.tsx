import { Route, HashRouter as Router, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PageNotFound } from 'pages/PageNotFound/PageNotFound';
import { routes } from 'routes';
import { Layout } from './components';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

const AppContent = () => {
  const location = useLocation();

  const logContainer = document.createElement('div');
  logContainer.style.position = 'fixed';
  logContainer.style.top = '50%';
  logContainer.style.left = '0';
  logContainer.style.background = 'white';
  logContainer.style.padding = '10px';
  logContainer.style.maxHeight = '50%';
  logContainer.style.overflow = 'auto';
  logContainer.style.zIndex = '9999';
  logContainer.style.fontSize = '14px';
  document.body.appendChild(logContainer);

  const log = (message: string) => {
    logContainer.innerHTML += `<p>${new Date().toLocaleTimeString()}: ${message}</p>`;
  };

  useEffect(() => {
    log(`AppContent: Route changed to: ${location.pathname}`);
    log(`AppContent: Available routes: ${JSON.stringify(routes.map(r => r.path))}`);
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
          <Route path="/test" element={<div style={{ padding: 20, background: 'white' }}>Test Page Works!</div>} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Layout>
      <MobileBottomNav />
    </>
  );
};

export const App = () => {
  const logContainer = document.createElement('div');
  logContainer.style.position = 'fixed';
  logContainer.style.top = '25%';
  logContainer.style.left = '0';
  logContainer.style.background = 'white';
  logContainer.style.padding = '10px';
  logContainer.style.maxHeight = '25%';
  logContainer.style.overflow = 'auto';
  logContainer.style.zIndex = '9999';
  logContainer.style.fontSize = '14px';
  document.body.appendChild(logContainer);

  logContainer.innerHTML += `<p>${new Date().toLocaleTimeString()}: App component mounted</p>`;

  return (
    <Router>
      <AppContent />
    </Router>
  );
};