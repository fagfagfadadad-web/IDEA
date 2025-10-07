import { PropsWithChildren } from 'react';
import { AuthRedirectWrapper } from '../../wrappers';
import { Footer } from './Footer';
import { Header } from './Header';
import { Background } from './Background';
import { Chat } from '../Chat';
import { useGetIsLoggedIn } from 'lib';

export const Layout = ({ children }: PropsWithChildren) => {
  const isLoggedIn = useGetIsLoggedIn();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden">
      <Background />
      <div className="relative z-10">
        <Header />
        <main className="flex flex-grow items-stretch justify-center p-0 pb-20 md:pb-0 overflow-x-hidden">
          <AuthRedirectWrapper>{children}</AuthRedirectWrapper>
        </main>
        <Footer />
      </div>
      {isLoggedIn && <Chat />}
    </div>
  );
};