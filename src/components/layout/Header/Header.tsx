import { useNavigate } from 'react-router-dom';
import { Button, MxLink } from 'components';
import { Chat } from '../../Chat';
import { environment } from '../../../config/config.mainnet';
import { getAccountProvider, useGetIsLoggedIn, useGetAccount } from 'lib';
import { RouteNamesEnum } from 'localConstants';

export const Header = () => {
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const navigate = useNavigate();
  const provider = getAccountProvider();

  const handleLogout = async () => {
    await provider.logout();
    navigate(RouteNamesEnum.home);
  };

  return (
    <header className='flex flex-row items-center justify-between pl-6 pr-6 pt-6'>
      <MxLink
        className='flex items-center justify-between'
        to={isLoggedIn ? RouteNamesEnum.home : RouteNamesEnum.home}
      >
        <div className='h-12 w-12 flex items-center justify-center'>
          <img src='/PupFi.png' alt='PupFi' className='w-full h-auto object-contain' />
        </div>
      </MxLink>

      <div className='flex items-center gap-2'>
        <div className='flex gap-1 items-center'>
          <div className='w-2 h-2 rounded-full bg-green-500' />
          <p className='text-gray-600 text-sm'>{environment}</p>
        </div>

        {isLoggedIn && (
          <div className='block md:hidden'>
            <Chat inHeader={true} />
          </div>
        )}

        {isLoggedIn && (
          <Button
            onClick={handleLogout}
            className='inline-block rounded-lg px-3 py-2 text-center hover:no-underline my-0 text-gray-600 hover:bg-slate-100 mx-0 text-sm'
          >
            Close
          </Button>
        )}

        {!isLoggedIn && (
          <Button
            onClick={() => {
              navigate(RouteNamesEnum.unlock);
            }}
          >
            Connect
          </Button>
        )}
      </div>
    </header>
  );
};