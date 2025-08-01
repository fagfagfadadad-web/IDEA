// src/components/Card.tsx
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PropsWithChildren, MouseEvent, CSSProperties } from 'react';
import { WithClassnameType } from 'types';

interface CardType extends PropsWithChildren, WithClassnameType {
  title?: string; // Zmeň na nepovinné
  description?: string;
  reference?: string; // Zmeň na nepovinné
  anchor?: string;
  onClick?: (e: MouseEvent) => void;
  style?: CSSProperties;
}

export const Card = (props: CardType) => {
  const { title, children, description, reference, anchor, onClick, style } = props;

  return (
    <div
      className='flex flex-col flex-1 rounded-xl bg-white p-6 justify-center'
      data-testid={props['data-testid']}
      id={anchor}
      onClick={onClick}
      style={style}
    >
      {title && (
        <h2 className='flex text-xl font-medium group'>
          {title}
          {reference && (
            <a
              href={reference}
              target='_blank'
              className='hidden group-hover:block ml-2 text-blue-600'
            >
              <FontAwesomeIcon icon={faInfoCircle} size='sm' />
            </a>
          )}
        </h2>
      )}
      {description && <p className='text-gray-400 mb-6'>{description}</p>}
      {children}
    </div>
  );
};