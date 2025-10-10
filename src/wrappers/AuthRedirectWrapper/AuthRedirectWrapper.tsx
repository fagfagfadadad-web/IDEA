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

  useEffect(() => {
    if (loading) {
      console.log('🔒 AuthRedirectWrapper: Still loading, waiting...');
      return;
    }

    const currentRoute = routes.find((route) => matchPath(route.path, pathname));
    const requireAuth = Boolean(currentRoute?.authenticatedRoute);

    console.log('🔒 AuthRedirectWrapper: useEffect triggered');
    console.log('🔒 AuthRedirectWrapper: isAuthenticated:', isAuthenticated, 'requireAuth:', requireAuth);

    // If user is authenticated and on /unlock page, redirect to home
    if (isAuthenticated && pathname === RouteNamesEnum.unlock) {
      console.log('🔒 AuthRedirectWrapper: Authenticated user on unlock page - redirecting to home');
      navigate(RouteNamesEnum.home);
      return;
    }

    // If user is not authenticated and route requires auth, redirect to unlock
    if (!isAuthenticated && requireAuth) {
      console.log('🔒 AuthRedirectWrapper: User not authenticated but route requires auth - redirecting to unlock');
      navigate(RouteNamesEnum.unlock);
    }
  }, [isAuthenticated, loading, pathname, navigate]);

  return <>{children}</>;
};
