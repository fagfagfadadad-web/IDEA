import { useState } from 'react'; // Added for hamburger menu toggle
import { useNavigate } from 'react-router-dom';
import { Button, MxLink } from 'components';
import { environment } from '../../../config/config.mainnet';
import { getAccountProvider, useGetIsLoggedIn, useGetAccount } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import MultiversXLogo from '../../../assets/img/multiversx-logo.svg?react';
import { NotificationsButton } from './components/NotificationsButton';

export const Header = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const navigate = useNavigate();
  const provider = getAccountProvider();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for hamburger menu toggle

  const handleLogout = async () => {
    await provider.logout();
    navigate(RouteNamesEnum.home);
    setIsMenuOpen(false); // Close menu on logout
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className='flex flex-row align-center justify-between pl-6 pr-6 pt-6'>
      <MxLink
        className='flex items-center justify-between'
        to={isLoggedIn ? RouteNamesEnum.home : RouteNamesEnum.home}
      >
        <MultiversXLogo className='w-full h-6' />
      </MxLink>

      {/* Hamburger Menu Toggle Button */}
      <button
        className='sm:hidden text-gray-600 focus:outline-none'
        onClick={toggleMenu}
        aria-label='Toggle menu'
      >
        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      <nav
        className={`${
          isMenuOpen ? 'block' : 'hidden'
        } sm:block h-full w-full text-sm sm:relative sm:left-auto sm:top-auto sm:flex sm:w-auto sm:flex-row sm:justify-end sm:bg-transparent`}
      >
        <div className='flex flex-col sm:flex-row justify-end container mx-auto items-center gap-2'>
          <div className='flex gap-1 items-center'>
            <div className='w-2 h-2 rounded-full bg-green-500' />
            <p className='text-gray-600'>{environment}</p>
          </div>

          {/* Token Sale Link */}
          <a
            href='https://ideagigs.store/token-sale'
            className='inline-block rounded-lg px-3 py-2 text-center hover:no-underline my-0 text-gray-600 hover:bg-slate-100 mx-0'
            onClick={() => setIsMenuOpen(false)} // Close menu on click
          >
            Token Sale
          </a>

          {isLoggedIn && (
            <>
              <NotificationsButton />
              <Button
                onClick={handleLogout}
                className='inline-block rounded-lg px-3 py-2 text-center hover:no-underline my-0 text-gray-600 hover:bg-slate-100 mx-0'
              >
                Close
              </Button>
            </>
          )}

          {!isLoggedIn && (
            <Button
              onClick={() => {
                navigate(RouteNamesEnum.unlock);
                setIsMenuOpen(false); // Close menu on click
              }}
              className='inline-block rounded-lg px-3 py-2 text-center hover:no-underline my-0 text-gray-600 hover:bg-slate-100 mx-0'
            >
              Connect
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};