import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useCreateReview, useOrderReview } from '../hooks/useReviews';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Card } from 'components';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onReviewSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  onReviewSubmitted,
}) => {
  const { user } = useAuth();
  const { success, error: showErrorToast } = useToast();
  const { data: existingReview } = useOrderReview(order?.id || '');
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const createReview = useCreateReview();

  // Update state when existing review changes
  React.useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    }
  }, [existingReview]);

  const handleSubmit = async () => {
    if (rating === 0) {
      showErrorToast('Please select a rating from 1 to 5 stars');
      return;
    }

    if (!comment.trim()) {
      showErrorToast('Please write a review comment');
      return;
    }

    if (!user?.id) {
      showErrorToast('Please log in to submit a review');
      return;
    }

    try {
      await createReview.mutateAsync({
        order_id: order.id,
        rating,
        comment: comment.trim(),
      });

      success(existingReview ? 'Review updated successfully!' : 'Review submitted successfully!');

      // Reset form if it's a new review
      if (!existingReview) {
        setRating(0);
        setHoveredRating(0);
        setComment('');
      }
      
      onClose();
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showErrorToast('Error submitting review. Please try again later.');
    }
  };

  const handleClose = () => {
    // Only reset if it's a new review
    if (!existingReview) {
      setRating(0);
      setHoveredRating(0);
      setComment('');
    }
    onClose();
  };

  // Get provider info from either gig-based or proposal-based order
  const getProviderInfo = () => {
    if (order?.gig?.provider) {
      return {
        username: order.gig.provider.username,
        avatar_url: order.gig.provider.avatar_url
      };
    }
    
    // For proposal-based orders, we might need to get provider info differently
    // This is a placeholder - you'll need to adapt based on your data structure
    return {
      username: "Provider",
      avatar_url: null
    };
  };

  // Get order title from either gig-based or proposal-based order
  const getOrderTitle = () => {
    if (order?.gig?.title) {
      return order.gig.title;
    }
    
    // For proposal-based orders
    if (order?.requirements?.description) {
      return order.requirements.description.substring(0, 50) + '...';
    }
    
    return "Custom Project";
  };

  const providerInfo = getProviderInfo();
  const orderTitle = getOrderTitle();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                {existingReview ? 'Update Your Review' : 'Rate Your Experience'}
              </h3>
                <p className="text-sm text-gray-600">
                {existingReview 
                  ? 'You can update your review for this order' 
                  : 'How was your experience with this order?'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Order Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              <p className="text-gray-800 font-bold mb-2">
                Order: {orderTitle}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xs text-white">
                  {providerInfo.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-800 text-sm font-medium">
                    {providerInfo.username}
                  </p>
                  <p className="text-gray-600 text-xs">
                    Service Provider
                  </p>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Star Rating */}
          <div className="space-y-4 text-center">
            <p className="text-gray-800 font-medium">
              Rate the service quality
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="transition-all duration-200 hover:scale-110"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  <Star
                    size={28}
                    fill={
                      star <= (hoveredRating || rating)
                        ? '#FFD700'
                        : 'transparent'
                    }
                    color={
                      star <= (hoveredRating || rating)
                        ? '#FFD700'
                        : '#718096'
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-sm">
              {rating === 0 && 'Click to rate'}
              {rating === 1 && '⭐ Poor'}
              {rating === 2 && '⭐⭐ Fair'}
              {rating === 3 && '⭐⭐⭐ Good'}
              {rating === 4 && '⭐⭐⭐⭐ Very Good'}
              {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
            </p>
          </div>

          <hr className="border-gray-200" />

          {/* Comment */}
          <div className="space-y-3">
            <p className="text-gray-800 font-medium">
              Share your experience
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience with this service provider..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
            <p className="text-gray-600 text-xs">
              {comment.length}/500 characters
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 sm:py-3 px-4 rounded-lg order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createReview.isLoading || rating === 0 || !comment.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 px-4 rounded-lg disabled:opacity-50 order-1 sm:order-2"
            >
              {createReview.isLoading 
                ? 'Submitting...' 
                : existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};