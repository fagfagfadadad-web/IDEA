import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DappProvider } from '@multiversx/sdk-dapp/wrappers/DappProvider';
import { NotificationModal, SignTransactionsModals, TransactionsToastList } from '@multiversx/sdk-dapp/UI';
import { EnvironmentsEnum } from '@multiversx/sdk-dapp/types';
import { Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import { ToastProvider } from './context/ToastContext';
import { PageNotFound } from 'pages/PageNotFound/PageNotFound';
import { routes } from 'routes';
import { Layout } from './components';

const environment = EnvironmentsEnum.devnet;
const customNetworkConfig = {
  id: 'devnet',
  name: 'Devnet',
  egldLabel: 'xEGLD',
  walletAddress: 'https://devnet-wallet.multiversx.com',
  apiAddress: 'https://devnet-api.multiversx.com',
  gatewayAddress: 'https://devnet-gateway.multiversx.com',
  explorerAddress: 'https://devnet-explorer.multiversx.com'
};

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
    <DappProvider
      environment={environment}
      customNetworkConfig={customNetworkConfig}
      dappConfig={{
        shouldUseWebViewProvider: true,
      }}
    >
      <ToastProvider>
        <BrowserRouter>
          <AppContent />
          <NotificationModal />
          <SignTransactionsModals />
          <TransactionsToastList />
        </BrowserRouter>
      </ToastProvider>
    </DappProvider>
  );
};