import { PropsWithChildren } from 'react';
import { Header } from './Header';

export const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div className="relative flex min-h-screen flex-col bg-gray-900">
      <Header />
      <main className="flex flex-grow">
        {children}
      </main>
    </div>
  );
};