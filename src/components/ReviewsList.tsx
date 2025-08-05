import React from 'react';
import { Star } from 'lucide-react';
import { Card } from 'components';

interface ReviewsListProps {
  reviews: any[];
  isLoading: boolean;
  error: Error | null;
  showTitle?: boolean;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ 
  reviews,
  isLoading,
  error,
  showTitle = true 
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center space-y-4 py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 rounded-md p-4">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">⚠️</span>
          <span className="text-gray-800">Error loading reviews: {error.message}</span>
        </div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          No reviews yet. Be the first to leave a review!
        </p>
      </div>
    );
  }

  // Calculate average rating
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          fill={star <= rating ? '#FFD700' : 'transparent'}
          color={star <= rating ? '#FFD700' : '#A0AEC0'}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              Reviews ({reviews.length})
            </h3>
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} />
              <span className="text-gray-800 text-sm">
                {averageRating.toFixed(1)} / 5
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="space-y-3">
              {/* Review Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xs text-white">
                    {review.order.client.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium text-sm">
                      {review.order.client.full_name || review.order.client.username}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>

              {/* Review Content */}
              <p className="text-gray-700 text-sm leading-relaxed">
                {review.comment}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};