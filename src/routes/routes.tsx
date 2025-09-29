import { RouteNamesEnum } from 'localConstants';
import {
  Home,
  Unlock,
  Profile,
  Admin,
  Leaderboard,
  Tasks,
  Referrals,
  Shop,
  Mining,
  Ships,
  Game
} from 'pages';
import { RouteType } from 'types';

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