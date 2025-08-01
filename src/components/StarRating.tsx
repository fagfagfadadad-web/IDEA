import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showText?: boolean;
  isInteractive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 16,
  showText = false,
  isInteractive = false,
  onRatingChange,
}) => {
  const [hoveredRating, setHoveredRating] = React.useState(0);

  const handleStarClick = (starRating: number) => {
    if (isInteractive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (isInteractive) {
      setHoveredRating(starRating);
    }
  };

  const handleStarLeave = () => {
    if (isInteractive) {
      setHoveredRating(0);
    }
  };

  const displayRating = isInteractive ? (hoveredRating || rating) : rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: maxRating }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= displayRating;
          
          return (
            <button
              key={starNumber}
              className={`transition-all duration-200 ${
                isInteractive ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              }`}
              onClick={() => handleStarClick(starNumber)}
              onMouseEnter={() => handleStarHover(starNumber)}
              onMouseLeave={handleStarLeave}
              disabled={!isInteractive}
            >
              <Star
                size={size}
                fill={isFilled ? '#FFD700' : 'transparent'}
                color={isFilled ? '#FFD700' : '#A0AEC0'}
              />
            </button>
          );
        })}
      </div>
      
      {showText && (
        <span className="text-gray-400 text-sm ml-2">
          {rating.toFixed(1)} / {maxRating}
        </span>
      )}
    </div>
  );
};