import { PropsWithChildren, useEffect } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { RouteNamesEnum } from 'localConstants';
import { routes } from 'routes';

export const AuthRedirectWrapper = ({ children }: PropsWithChildren) => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  console.log('🔒 AuthRedirectWrapper: pathname:', pathname);
  console.log('🔒 AuthRedirectWrapper: isAuthenticated:', isAuthenticated);
  console.log('🔒 AuthRedirectWrapper: loading:', loading);

  const currentRoute = routes.find((route) => matchPath(route.path, pathname));
  console.log('🔒 AuthRedirectWrapper: currentRoute:', currentRoute);

  const requireAuth = Boolean(currentRoute?.authenticatedRoute);
  console.log('🔒 AuthRedirectWrapper: requireAuth:', requireAuth);

  useEffect(() => {
    if (loading) {
      console.log('🔒 AuthRedirectWrapper: Still loading, waiting...');
      return;
    }

    console.log('🔒 AuthRedirectWrapper: useEffect triggered');
    console.log('🔒 AuthRedirectWrapper: isAuthenticated:', isAuthenticated, 'requireAuth:', requireAuth);

    if (isAuthenticated && !requireAuth) {
      console.log('🔒 AuthRedirectWrapper: User is authenticated but route does not require auth - NOT redirecting');
      return;
    }

    if (!isAuthenticated && requireAuth) {
      console.log('🔒 AuthRedirectWrapper: User not authenticated but route requires auth - redirecting to home');
      navigate(RouteNamesEnum.home);
    }
  }, [isAuthenticated, loading, currentRoute]);

  return <>{children}</>;
};
