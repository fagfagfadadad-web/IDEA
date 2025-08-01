import { PropsWithChildren, useEffect } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useGetIsLoggedIn } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { routes } from 'routes';

export const AuthRedirectWrapper = ({ children }: PropsWithChildren) => {
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  console.log('🔒 AuthRedirectWrapper: pathname:', pathname);
  console.log('🔒 AuthRedirectWrapper: isLoggedIn:', isLoggedIn);

  const currentRoute = routes.find((route) => matchPath(route.path, pathname));
  console.log('🔒 AuthRedirectWrapper: currentRoute:', currentRoute);

  const requireAuth = Boolean(currentRoute?.authenticatedRoute);
  console.log('🔒 AuthRedirectWrapper: requireAuth:', requireAuth);

  useEffect(() => {
    console.log('🔒 AuthRedirectWrapper: useEffect triggered');
    console.log('🔒 AuthRedirectWrapper: isLoggedIn:', isLoggedIn, 'requireAuth:', requireAuth);
    
    if (isLoggedIn && !requireAuth) {
      console.log('🔒 AuthRedirectWrapper: User is logged in but route does not require auth - NOT redirecting');
      // Don't redirect logged in users away from public pages
      return;
    }

    if (!isLoggedIn && requireAuth) {
      console.log('🔒 AuthRedirectWrapper: User not logged in but route requires auth - redirecting to home');
      navigate(RouteNamesEnum.home);
    }
  }, [isLoggedIn, currentRoute]);

  return <>{children}</>;
};
