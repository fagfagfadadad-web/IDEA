import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, DollarSign, Coins } from 'lucide-react';
import { Button } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useAllGigs } from '../../hooks/useGigs';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useTrackGigView } from '../../hooks/useGigViews';
import { useAuth } from '../../context/AuthContext';

const categories = [
  'Programming & Tech',
  'Graphics & Design',
  'Digital Marketing',
  'Writing & Translation',
  'Video & Animation',
  'AI Services',
  'Music & Audio',
  'Business',
  'Consulting'
];

// Sample ad data
const sampleAd = {
  imageUrl: "https://i.postimg.cc/VNbxByZ5/Nov-projekt.png",
  link: "https://xportal.com",
};
export const Gigs = () => {
  const { data: gigs, isLoading, error } = useAllGigs();
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Initialize filters from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchTerm) params.set('search', searchTerm);
    
    setSearchParams(params);
  }, [selectedCategory, searchTerm, setSearchParams]);

  const getStatusColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'programming & tech':
        return '#01c3a8';
      case 'graphics & design':
        return '#1890ff';
      case 'digital marketing':
        return '#ffb741';
      case 'writing & translation':
        return '#ff6f61';
      case 'video & animation':
        return '#a259ff';
      case 'ai services':
        return '#00ddeb';
      case 'music & audio':
        return '#ffcc33';
      case 'business':
        return '#2ecc71';
      case 'consulting':
        return '#e91e63';
      default:
        return '#a63d2a';
    }
  };

  const handleGigClick = (gigId: string) => {
    // Track view before navigation
    trackView(gigId, user?.id);
    navigate(`/gigs/${gigId}`);
  };

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  // Filter gigs based on search and category
  const filteredGigs = gigs?.filter(gig => {
    const matchesSearch = !searchTerm || 
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.provider?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || gig.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Function to render gigs with ads
  const renderGigsWithAds = (gigs: any[]) => {
    const elements = [];
    
    for (let i = 0; i < gigs.length; i += 8) {
      const gigBatch = gigs.slice(i, i + 8);
      
      // Add gigs batch
      elements.push(
        <div key={`gigs-${i}`} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {gigBatch.map((gig) => {
            const statusColor = getStatusColor(gig.category);
            const paymentToken = gig.payment_token || 'EGLD';
            const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDEA';
            const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={16} /> : <Coins size={16} />;
            const hasNoFees = paymentToken !== 'EGLD';

            return (
              <div
                key={gig.id}
                className="max-w-80 gradient-card cursor-pointer group"
                onClick={() => handleGigClick(gig.id)}
                style={{
                  borderTopColor: statusColor,
                  borderTopWidth: '3px'
                }}
              >
                <div className="flex justify-between items-center p-3 border-b border-gray-100">
                  <span className="text-xs text-gray-500">
                    {new Date(gig.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                    >
                      {gig.category}
                    </span>
                    {hasNoFees && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        No Fees
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative h-48">
                  <img
                    src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                    alt={gig.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-3 space-y-3">
                  <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                    {gig.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {gig.description}
                  </p>
                  <p className="text-sm text-gray-800">
                    Duration: {gig.duration} days
                  </p>
                </div>

                <div className="flex justify-between items-center p-3 border-t border-gray-100">
                  <div 
                    className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors"
                    onClick={(e) => handleProfileClick(e, gig.provider.id)}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-sm text-white">
                      {gig.provider.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-800">
                      {gig.provider.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {tokenIcon}
                    <span className="text-lg font-bold" style={{ color: statusColor }}>
                      {gig.price} {tokenSymbol}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
      
      // Add ad banner after every 8 gigs (except after the last batch)
      if (i + 8 < gigs.length) {
        elements.push(
          <div key={`ad-${i}`} className="flex justify-center my-8">
            <a href={sampleAd.link} target="_blank" rel="noopener noreferrer">
              <img
                src={sampleAd.imageUrl}
                alt="Advertisement"
                className="w-full max-w-[516px] h-auto max-h-32 object-contain rounded-xl shadow-lg hover:brightness-110 transition-all duration-300"
                onError={(e) => console.error("Ad image error:", e)}
                onLoad={() => console.log("Ad image loaded successfully")}
              />
            </a>
          </div>
        );
      }
    }
    
    return elements;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-2">Browse Gigs</h1>
            <p className="text-gray-600 text-sm md:text-base">
              Discover talented Web3 professionals and their services
            </p>
          </div>
          
          {isLoggedIn && (
            <Button
              onClick={() => navigate('/create-gig')}
              variant="gradient"
              fullWidth={isMobile}
            >
              Create Gig
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="gradient-card p-4 md:p-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search gigs, providers, keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mobile-input pl-10"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mobile-select w-full md:max-w-48"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters button */}
            {(searchTerm || selectedCategory) && (
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                }}
                variant="outline"
                size="sm"
              >
                Clear all filters
              </Button>
            )}
          </div>
        </div>

        {/* Results count */}
        {filteredGigs && (
          <div>
            <p className="text-gray-600 text-sm md:text-base">
              Found {filteredGigs.length} gig{filteredGigs.length !== 1 ? 's' : ''}
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory && ` in ${selectedCategory}`}
            </p>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-700">Loading gigs...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span className="text-red-700">Error loading gigs. Please try again later.</span>
            </div>
          </div>
        ) : filteredGigs?.length === 0 ? (
          <div className="gradient-card p-6 text-center">
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory ? 'No gigs found matching your criteria.' : 'No gigs available yet.'}
            </p>
            {isLoggedIn && (
              <Button
                onClick={() => navigate('/create-gig')}
                variant="gradient"
              >
                Create the first gig
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Carousel */}
            <div className="space-y-4">
              {/* Mobile Layout */}
              <div className="md:hidden">
                {filteredGigs.map((gig) => {
                  const statusColor = getStatusColor(gig.category);
                  const paymentToken = gig.payment_token || 'EGLD';
                  const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDEA';
                  const tokenIcon = paymentToken === 'EGLD' ? <DollarSign size={16} /> : <Coins size={16} />;
                  const hasNoFees = paymentToken !== 'EGLD';

                  return (
                    <div
                      key={gig.id}
                      className="w-full gradient-card cursor-pointer group mb-4"
                      onClick={() => handleGigClick(gig.id)}
                      style={{
                        borderTopColor: statusColor,
                        borderTopWidth: '3px'
                      }}
                    >
                      <div className="flex justify-between items-center p-3 border-b border-gray-100">
                        <span className="text-xs text-gray-500">
                          {new Date(gig.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                          >
                            {gig.category}
                          </span>
                          {hasNoFees && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              No Fees
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="relative h-32">
                        <img
                          src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                          alt={gig.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-3 space-y-3">
                        <h3 className="text-base font-bold text-gray-800 line-clamp-2">
                          {gig.title}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {gig.description}
                        </p>
                        <p className="text-sm text-gray-800">
                          Duration: {gig.duration} days
                        </p>
                      </div>

                      <div className="flex justify-between items-center p-3 border-t border-gray-100">
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors"
                          onClick={(e) => handleProfileClick(e, gig.provider.id)}
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-sm text-white">
                            {gig.provider.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-800">
                            {gig.provider.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {tokenIcon}
                          <span className="text-base font-bold" style={{ color: statusColor }}>
                            {gig.price} {tokenSymbol}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Layout with Ads */}
              <div className="hidden md:block space-y-8">
                {filteredGigs && renderGigsWithAds(filteredGigs)}
              </div>
            </div>
          </>
        )}

        {/* Add bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
      </div>
    </div>
  );
};