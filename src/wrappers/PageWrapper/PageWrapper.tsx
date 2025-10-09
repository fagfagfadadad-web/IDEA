import { PropsWithChildren } from 'react';

export const PageWrapper = ({ children }: PropsWithChildren) => {
  return (
    <div className='flex flex-1 rounded-xl p-6 sm:flex-row items-center justify-center' style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}>
      {children}
    </div>
  );
};
