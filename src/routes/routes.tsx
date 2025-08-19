import { RouteNamesEnum } from 'localConstants';
import {
  Disclaimer
} from 'pages';
import { RouteType } from 'types';
import React from 'react';

const Home = React.lazy(() => import('pages/Home').then(module => ({ default: module.Home })));
const Builder = React.lazy(() => import('pages/Builder').then(module => ({ default: module.Builder })));
const Preview = React.lazy(() => import('pages/Preview').then(module => ({ default: module.Preview })));

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
    path: RouteNamesEnum.builder,
    title: 'Builder',
    component: Builder
  },
  {
    path: RouteNamesEnum.preview,
    title: 'Preview',
    component: Preview
  },
  {
    path: RouteNamesEnum.disclaimer,
    title: 'Disclaimer',
    component: Disclaimer
  }
];