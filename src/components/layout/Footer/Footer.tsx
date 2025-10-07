import { Twitter, Send } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className='w-full border-t border-gray-200 bg-white py-12 px-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <img src='/PupFi.png' alt='PupFi' className='w-8 h-8' />
              <span className='text-xl font-bold text-purple-500'>PupFi</span>
            </div>
            <p className='text-gray-600 text-sm'>
              The ultimate virtual pet care experience on MultiversX blockchain
            </p>
          </div>

          <div>
            <h3 className='text-gray-900 font-semibold mb-4'>Game</h3>
            <ul className='space-y-2'>
              <li>
                <a href='/game' className='text-gray-600 hover:text-gray-900 transition-colors text-sm'>
                  Feed Dogs
                </a>
              </li>
              <li>
                <a href='/ships' className='text-gray-600 hover:text-gray-900 transition-colors text-sm'>
                  Dogs
                </a>
              </li>
              <li>
                <a href='/shop' className='text-gray-600 hover:text-gray-900 transition-colors text-sm'>
                  Pet Store
                </a>
              </li>
              <li>
                <a href='/leaderboard' className='text-gray-600 hover:text-gray-900 transition-colors text-sm'>
                  Leaderboard
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='text-gray-900 font-semibold mb-4'>Community</h3>
            <ul className='space-y-2'>
              <li>
                <a href='/tasks' className='text-gray-600 hover:text-gray-900 transition-colors text-sm'>
                  Tasks
                </a>
              </li>
              <li>
                <a href='/referrals' className='text-gray-600 hover:text-gray-900 transition-colors text-sm'>
                  Referrals
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='text-gray-900 font-semibold mb-4'>Connect</h3>
            <div className='flex gap-4 mb-4'>
              <a
                href='https://twitter.com/pupfi'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-gray-900 transition-colors'
              >
                <Twitter size={20} />
              </a>
              <a
                href='https://t.me/pupfi'
                target='_blank'
                rel='noopener noreferrer'
                className='text-gray-600 hover:text-gray-900 transition-colors'
              >
                <Send size={20} />
              </a>
            </div>
            <p className='text-gray-600 text-sm'>Built on MultiversX</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
