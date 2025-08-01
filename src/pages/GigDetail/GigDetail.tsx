import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Check, Star, MessageCircle, DollarSign, Coins, AlertTriangle } from 'lucide-react';
import { Button, Card, OrderRequirementsModal } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useGigById, useAllGigs } from '../../hooks/useGigs';
import { useReviewsByGig } from '../../hooks/useReviews';

export const GigDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  
  useEffect(() => {
    console.log('🔍 GigDetail: Component mounted with ID:', id);
    console.log('🔍 GigDetail: Current URL:', window.location.href);
  }, [id]);
  
  // Real hooks
  const { data: gig, isLoading, error } = useGigById(id || '');
  const { data: allGigs } = useAllGigs();
  const { data: reviews } = useReviewsByGig(id || '');

  useEffect(() => {
    console.log('🔍 GigDetail: Gig data:', gig);
    console.log('🔍 GigDetail: Loading:', isLoading);
    console.log('🔍 GigDetail: Error:', error);
  }, [gig, isLoading, error]);

  // Get similar gigs from the same category
  const similarGigs = allGigs?.filter(g => 
    g.id !== gig?.id && 
    g.category === gig?.category && 
    g.status === 'active'
  ).slice(0, 3) || [];

  const [isRequirementsOpen, setIsRequirementsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const handleOrder = () => {
    if (!isLoggedIn) {
      alert('Please login to place an order');
      return;
    }

    // Check if the gig is active
    if (gig && gig.status !== 'active') {
      alert('This gig is currently not accepting new orders');
      return;
    }

    setIsRequirementsOpen(true);
  };

  const handleOrderCreated = (newOrderId: string) => {
    setOrderId(newOrderId);
    setIsRequirementsOpen(false);
    navigate(`/orders/${newOrderId}`);
  };

  const handleContactSeller = () => {
    if (!isLoggedIn) {
      alert('Please login to contact the seller');
      return;
    }

    setIsChatOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="bg-gray-800 p-8 rounded-lg">
          <div className="flex justify-center">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">Loading gig details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="container mx-auto max-w-7xl px-6 py-8">
        <div className="bg-gray-800 p-8 rounded-lg">
          <p className="text-white">{error ? `Error: ${error.message}` : 'Gig not found'}</p>
        </div>
      </div>
    );
  }

  // Parse package details from gig description
  const packageDetails = gig.description.split('\n\nPackage Includes:\n')[1]?.split('\n') || [];
  const description = gig.description.split('\n\nPackage Includes:\n')[0];

  // Calculate average rating from reviews
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  // Get payment token info
  const paymentToken = gig.payment_token || 'EGLD';
  const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDEA';
  const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={16} /> : <Coins size={16} />;
  const hasNoFees = paymentToken !== 'EGLD';

  // Check if gig is active
  const isActive = gig.status === 'active';

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Images */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <img
              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
              alt={gig.title}
              className="w-full h-96 object-cover"
            />
          </div>

          {/* About This Gig */}
          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">About This Gig</h2>
            <p className="text-gray-300 text-lg mb-6">
              {description}
            </p>

            {/* Package Details */}
            <h3 className="text-xl font-bold text-white mb-4">What's Included:</h3>
            <ul className="space-y-3">
              {packageDetails.map((detail: string, index: number) => (
                <li key={index} className="flex items-center">
                  <Check className="text-blue-400 mr-3" size={16} />
                  <span className="text-white">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Reviews Section */}
          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Reviews</h2>
            {reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-700 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={i < review.rating ? "text-yellow-400 fill-current" : "text-gray-600"}
                          />
                        ))}
                      </div>
                      <span className="text-gray-400 text-sm">
                        by {review.client.username}
                      </span>
                    </div>
                    <p className="text-gray-300">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8 lg:sticky lg:top-8">
          {/* Pricing Card */}
          <div className="bg-gray-800 rounded-lg p-6 w-full">
            <div className="space-y-6">
              {/* Status Badge for Inactive Gigs */}
              {!isActive && (
                <div className="bg-yellow-900 border border-yellow-500 rounded-md p-3">
                  <div className="flex items-center">
                    <AlertTriangle className="text-yellow-400 mr-2" size={16} />
                    <span className="text-white">
                      This gig is currently {gig.status === 'paused' ? 'paused' : 'inactive'} and not accepting new orders
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {tokenIcon}
                  <h3 className="text-2xl font-bold text-white">
                    {gig.price} {tokenSymbol}
                  </h3>
                </div>
                {hasNoFees && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    No Fees!
                  </span>
                )}
              </div>
              
              <p className="text-gray-400">
                Delivery in {gig.duration} days
              </p>

              {/* Payment Token Info */}
              <div className="bg-gray-800 p-3 rounded-md">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white text-sm font-medium">
                    Payment Token:
                  </span>
                  <div className="flex items-center gap-1">
                    {tokenIcon}
                    <span className="text-white text-sm font-bold">
                      {tokenSymbol}
                    </span>
                  </div>
                </div>
                {hasNoFees ? (
                  <p className="text-green-300 text-xs">
                    ✅ Zero platform fees with IDEA tokens
                  </p>
                ) : (
                  <p className="text-orange-300 text-xs">
                    ⚠️ 10% platform fee applies to EGLD payments
                  </p>
                )}
              </div>
              
              {/* Rating Display */}
              {reviews && reviews.length > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < averageRating ? "text-yellow-400 fill-current" : "text-gray-600"}
                      />
                    ))}
                    <span className="text-white ml-2">{averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-gray-400 text-sm">
                    ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
              
              <hr className="border-gray-600" />
              
              {isLoggedIn ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleOrder}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                    disabled={!isActive}
                  >
                    {tokenIcon}
                    {isActive ? `Continue (${gig.price} ${tokenSymbol})` : 'Currently Unavailable'}
                  </Button>
                  <Button
                    onClick={handleContactSeller}
                    className="w-full bg-transparent border border-gray-600 text-gray-300 hover:bg-gray-800 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} />
                    Contact Seller
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => navigate('/unlock')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium"
                >
                  Login to Order
                </Button>
              )}
            </div>
          </div>

          {/* Seller Card */}
          <div className="bg-gray-800 rounded-lg p-6 w-full">
            <div className="space-y-4">
              <Link
                to={`/profile/${gig.provider?.id}`}
                className="block hover:no-underline"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-xl text-white">
                    {gig.provider?.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {gig.provider?.username}
                    </h3>
                    <p className="text-gray-400">
                      {gig.provider?.full_name}
                    </p>
                  </div>
                </div>
              </Link>
              <p className="text-gray-400">
                {gig.provider?.bio || "No bio available"}
              </p>
              <hr className="border-gray-600" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Member since</p>
                  <p className="font-bold text-white">
                    {new Date(gig.provider?.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Avg. Response Time</p>
                  <p className="font-bold text-white">1 hour</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Gigs */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-black mb-6">Similar Gigs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {similarGigs?.filter(g => g.id !== gig.id && g.status === 'active')
            .slice(0, 3)
            .map((similarGig) => {
              const simTokenSymbol = similarGig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA';
              const simTokenIcon = similarGig.payment_token === 'EGLD' ? <DollarSign size={14} /> : <Coins size={14} />;
              
              return (
                <div
                  key={similarGig.id}
                  className="bg-gray-800 rounded-lg cursor-pointer hover:-translate-y-1 transition-transform duration-200"
                  onClick={() => navigate(`/gigs/${similarGig.id}`)}
                >
                  <img
                    src={similarGig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                    alt={similarGig.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="p-4 space-y-3">
                    <h3 className="text-lg font-bold text-white">{similarGig.title}</h3>
                    <p className="text-gray-400 line-clamp-2">
                      {similarGig.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        {simTokenIcon}
                        <span className="text-blue-400 font-bold">
                          {similarGig.price} {simTokenSymbol}
                        </span>
                      </div>
                      {similarGig.payment_token !== 'EGLD' && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          No Fees
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Order Requirements Modal */}
      <OrderRequirementsModal
        isOpen={isRequirementsOpen}
        onClose={() => setIsRequirementsOpen(false)}
        gig={gig}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};