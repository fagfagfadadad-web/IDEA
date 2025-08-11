import { RouteNamesEnum } from 'localConstants';
import {
  Admin,
  ClientRequestDetail, 
  ClientRequests, 
  CreateClientRequest, 
  CreateGig, 
  Disclaimer, 
  Documentation, 
  GigDetail, 
  Gigs, 
  MyRequests, 
  OrderDetails, 
  ProposalDetail, 
  RewardsHub,
  TokenSale,
  Unlock
} from 'pages';
import { RouteType } from 'types';
import React from 'react';

const Home = React.lazy(() => import('pages/Home'));
const Profile = React.lazy(() => import('pages/Profile'));
const Search = React.lazy(() => import('pages/Search').then(module => ({ default: module.Search })));

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
    title: 'Unlock',
    component: Unlock,
    authenticatedRoute: false
  },
  {
    path: RouteNamesEnum.disclaimer,
    title: 'Disclaimer',
    component: Disclaimer
  }
  ,
  {
    path: RouteNamesEnum.gigs,
    title: 'Browse Gigs',
    component: Gigs
  },
  {
    path: RouteNamesEnum.gigDetail,
    title: 'Gig Detail',
    component: GigDetail
  },
  {
    path: RouteNamesEnum.createGig,
    title: 'Create Gig',
    component: CreateGig,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.editGig,
    title: 'Edit Gig',
    component: () => <CreateGig isEditing={true} />,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.profile,
    title: 'My Profile',
    component: Profile,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.profileDetail,
    title: 'User Profile',
    component: Profile
  },
  {
    path: RouteNamesEnum.clientRequests,
    title: 'Open Bids',
    component: ClientRequests
  },
  {
    path: RouteNamesEnum.createClientRequest,
    title: 'Create Request',
    component: CreateClientRequest,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.clientRequestDetail,
    title: 'Request Detail',
    component: ClientRequestDetail
  },
  {
    path: RouteNamesEnum.proposalDetail,
    title: 'Proposal Detail',
    component: ProposalDetail
  },
  {
    path: RouteNamesEnum.myRequests,
    title: 'My Requests',
    component: MyRequests,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.orderDetails,
    title: 'Order Details',
    component: OrderDetails,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.admin,
    title: 'Admin Panel',
    component: Admin,
    authenticatedRoute: true
  },
  {
    path: RouteNamesEnum.documentation,
    title: 'Documentation',
    component: Documentation
  },
  {
    path: RouteNamesEnum.search,
    title: 'Search',
    component: Search
  },
  {
    path: RouteNamesEnum.tokenSale,
    title: 'Token Sale',
    component: TokenSale
  },
  {
    path: RouteNamesEnum.rewardsHub,
    title: 'Rewards Hub',
    component: RewardsHub,
    authenticatedRoute: true
  }
];
