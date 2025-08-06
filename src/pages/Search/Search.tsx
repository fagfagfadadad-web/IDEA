import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useAllGigs } from '../../hooks/useGigs';

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


export const Search = () => {
  const { data: gigs, isLoading } = useAllGigs();
  const { address } = useGetAccount();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  // Initialize search term from URL params
  useEffect(() => {
    const searchParam = searchParams.get('search');
    const categoryParam = searchParams.get('category');
    
    if (searchParam) {
      setSearchTerm(searchParam);
    }
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    
    setSearchParams(params);
  }, [searchTerm, selectedCategory, setSearchParams]);

  const getStatusColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'programming & tech':
      case 'development':
        return '#01c3a8';
      case 'graphics & design':
      case 'design':
        return '#1890ff';
      case 'digital marketing':
      case 'marketing':
        return '#ffb741';
      case 'writing & translation':
      case 'writing':
        return '#ff6f61';
      case 'video & animation':
      case 'video':
        return '#a259ff';
      case 'ai services':
      case 'ai':
        return '#00ddeb';
      case 'music & audio':
      case 'audio':
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
    navigate(`/gigs/${gigId}`);
  };

  const handleProfileClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
  };

  // Enhanced filtering logic
  const filteredGigs = gigs?.filter(gig => {
    // Search term matching (title, description, provider name)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      gig.title.toLowerCase().includes(searchLower) ||
      gig.description.toLowerCase().includes(searchLower) ||
      gig.provider?.username?.toLowerCase().includes(searchLower) ||
      gig.provider?.full_name?.toLowerCase().includes(searchLower);

    // Category matching (flexible matching for different category formats)
    const matchesCategory = !selectedCategory || 
      gig.category.toLowerCase() === selectedCategory.toLowerCase() ||
      // Handle legacy category names
      (selectedCategory === 'Programming & Tech' && gig.category.toLowerCase() === 'development') ||
      (selectedCategory === 'Graphics & Design' && gig.category.toLowerCase() === 'design') ||
      (selectedCategory === 'Digital Marketing' && gig.category.toLowerCase() === 'marketing') ||
      (selectedCategory === 'Writing & Translation' && gig.category.toLowerCase() === 'writing') ||
      (selectedCategory === 'Video & Animation' && gig.category.toLowerCase() === 'video') ||
      (selectedCategory === 'AI Services' && gig.category.toLowerCase() === 'ai') ||
      (selectedCategory === 'Music & Audio' && gig.category.toLowerCase() === 'audio');

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Search Gigs</h1>
        </div>
        <Card className="p-3 md:p-4" title="Search and Filters" reference="#">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search for gigs, providers, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 md:py-3 text-sm md:text-base bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 md:min-w-48 p-2 md:p-3 text-sm md:text-base bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* Clear filters button */}
              {(searchTerm || selectedCategory) && (
                <Button
                  onClick={clearFilters}
                  className="text-blue-400 hover:text-blue-300 bg-transparent border-none"
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Search Results */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredGigs?.length === 0 ? (
          <Card className="p-6" title="No Results" reference="#">
            <p className="text-gray-400">
              {searchTerm || selectedCategory ? 'No gigs found matching your criteria.' : 'No gigs available.'}
            </p>
          </Card>
        ) : (
          <>
            {/* Results count */}
            <div>
              <p className="text-gray-400 mb-3 md:mb-4 text-sm md:text-base">
                Found {filteredGigs?.length} gig{filteredGigs?.length !== 1 ? 's' : ''}
                {searchTerm && ` for "${searchTerm}"`}
                {selectedCategory && ` in ${selectedCategory}`}
              </p>
            </div>

            <>
              {/* Mobile Carousel */}
              <div className="md:hidden px-2">
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {filteredGigs?.map((gig) => {
                    const statusColor = getStatusColor(gig.category);
                    const paymentToken = gig.payment_token || 'EGLD';
                    const tokenSymbol = paymentToken === 'EGLD' ? 'EGLD' : 'IDEA';
                    const hasNoFees = paymentToken !== 'EGLD';

                    return (
                      <div
                        key={gig.id}
                        className="min-w-[260px] w-[260px] rounded-lg bg-white border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer relative flex-shrink-0"
                        title="Gig"
                        style={{
                          borderTopColor: statusColor,
                          borderTopWidth: '3px'
                        }}
                      >
                        {/* Gig Image */}
                        <div className="relative">
                          <img
                            src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                            alt={gig.title}
                            className="w-full h-32 object-cover"
                          />
                          <span
                            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                          >
                            {gig.category.substring(0, 8)}...
                          </span>
                          {hasNoFees && (
                            <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              No Fees
                            </span>
                          )}
                        </div>

                        <div className="p-3 space-y-2">
                          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 h-8">
                            {gig.title}
                          </h3>
                          
                          <p className="text-gray-600 line-clamp-2 text-xs h-6">
                            {gig.description}
                          </p>

                          {/* Provider info */}
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={(e) => handleProfileClick(e, gig.provider.id)}
                          >
                            <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                              {gig.provider.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-600 text-xs truncate">
                              by {gig.provider.username.substring(0, 10)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <span className="text-blue-600 font-bold text-sm">
                              {gig.price} {tokenSymbol}
                            </span>
                            <span className="text-gray-600 text-xs">
                              {gig.duration} days
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Grid */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {filteredGigs?.map((gig) => {
                  const statusColor = getStatusColor(gig.category);

                  return (
                    <Card
                      key={gig.id}
                      className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                      title={gig.title}
                      reference="#"
                      onClick={() => handleGigClick(gig.id)}
                      style={{
                        borderTopColor: statusColor,
                        borderTopWidth: '3px'
                      }}
                    >
                      {/* Gig Image */}
                      <div className="relative">
                        <img
                          src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                          alt={gig.title}
                          className="w-full h-48 object-cover"
                        />
                        <span
                          className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                        >
                          {gig.category}
                        </span>
                      </div>

                      <div className="p-4 space-y-3">
                        <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                          {gig.title}
                        </h3>
                        
                        <p className="text-gray-600 line-clamp-3 text-sm">
                          {gig.description}
                        </p>

                        {/* Provider info */}
                        <div
                          className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={(e) => handleProfileClick(e, gig.provider.id)}
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden relative bg-gray-300">
                            {gig.provider?.avatar_url ? (
                              <>
                                <img
                                  src={gig.provider.avatar_url}
                                  alt={gig.provider.username || "Provider"}
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
                                  className="fallback-avatar w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-700 absolute inset-0"
                                  style={{ display: 'none' }}
                                >
                                  {gig.provider.username.charAt(0).toUpperCase()}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-700">
                                {gig.provider.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-gray-600 text-sm">
                            by {gig.provider.username}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <span className="text-blue-600 font-bold text-lg">
                            {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDEA'}
                          </span>
                          <span className="text-gray-600 text-sm">
                            {gig.duration} days
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          </>
        )}

        {/* Add bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};