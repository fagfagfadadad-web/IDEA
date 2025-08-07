import React from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Star size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">No reviews yet</h3>
        <p className="text-gray-600">
          This provider hasn't received any reviews yet.
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
            {console.log('🔍 ReviewsList: Rendering review:', review)}
            {console.log('🔍 ReviewsList: Review client info:', review.order?.client)}
            {console.log('🔍 ReviewsList: Client username:', review.order?.client?.username)}
            {console.log('🔍 ReviewsList: Client full_name:', review.order?.client?.full_name)}
            <div className="space-y-3">
              {/* Review Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400">
                    {review.order?.client?.avatar_url ? (
                      <>
                        <img
                          src={review.order.client.avatar_url}
                          alt={review.order.client.username || "Client"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }
                          }}
                        />
                        <div 
                          className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white absolute inset-0"
                          style={{ display: 'none' }}
                        >
                          {review.order?.client?.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-xs text-white">
                        {review.order?.client?.username?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-800 font-medium text-sm">
                      {review.order?.client?.full_name || review.order?.client?.username || "Anonymous"}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  Review for: <span className="font-medium">{review.order?.gig?.title || 'Unknown Gig'}</span>
                <StarRating rating={review.rating} />
              </div>

              {/* Review Content */}
              <p className="text-gray-700 text-sm leading-relaxed">
                {review.comment}
              </p>

              {/* Order Info */}
              {review.order && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-gray-500 text-xs">
                    Review for provider: <span className="font-medium">{review.provider?.username || 'Unknown Provider'}</span>
                    {review.order.gig_id && (
                      <span className="text-gray-400"> • Order #{review.order.id?.substring(0, 8)}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};