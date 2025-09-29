import { RouteNamesEnum } from 'localConstants';
import { lazy } from 'react';
import { RouteType } from 'types';

// Lazy load all page components to avoid circular dependencies
const Home = lazy(() => import('pages').then(module => ({ default: module.Home })));
const Unlock = lazy(() => import('pages').then(module => ({ default: module.Unlock })));
const Profile = lazy(() => import('pages').then(module => ({ default: module.Profile })));
const Admin = lazy(() => import('pages').then(module => ({ default: module.Admin })));
const Leaderboard = lazy(() => import('pages').then(module => ({ default: module.Leaderboard })));
const Tasks = lazy(() => import('pages').then(module => ({ default: module.Tasks })));
const Referrals = lazy(() => import('pages').then(module => ({ default: module.Referrals })));
const Shop = lazy(() => import('pages').then(module => ({ default: module.Shop })));
const Mining = lazy(() => import('pages').then(module => ({ default: module.Mining })));
const Ships = lazy(() => import('pages').then(module => ({ default: module.Ships })));
const Game = lazy(() => import('pages').then(module => ({ default: module.Game })));

interface RouteWithTitleType extends RouteType {
  title: string;
  authenticatedRoute?: boolean;
  children?: RouteWithTitleType[];
}

export const routes: RouteWithTitleType[] = [
  {
    path: RouteNamesEnum.home,
    title: 'Home',
    component: Home,
  },
  {
    path: RouteNamesEnum.unlock,
    title: 'Connect Wallet',
    component: Unlock,
    authenticatedRoute: false
  },
  {
    path: RouteNamesEnum.mining,
    title: 'Mining',
    component: Mining,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.ships,
    title: 'Ships',
    component: Ships,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.shop,
    title: 'Shop',
    component: Shop,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.tasks,
    title: 'Tasks',
    component: Tasks,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.referrals,
    title: 'Referrals',
    component: Referrals,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.leaderboard,
    title: 'Leaderboard',
    component: Leaderboard
  },
  {
    path: RouteNamesEnum.profile,
    title: 'Profile',
    component: Profile,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.admin,
    title: 'Admin Panel',
    component: Admin,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.game,
    title: 'Mini Game',
    component: Game,
    authenticatedRoute: true
  }
];