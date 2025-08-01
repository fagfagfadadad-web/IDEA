import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, Clock, DollarSign, Calendar, Briefcase, Tag as TagIcon } from 'lucide-react';
import { Button, Card } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useClientRequests } from '../../hooks/useClientRequests';

// Same categories as in the Gigs component
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


export const ClientRequests = () => {
  const { data: requests, isLoading, error } = useClientRequests();
  const { address } = useGetAccount();
  
  const isLoggedIn = useGetIsLoggedIn();
  const navigate = useNavigate();
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

  const handleCreateRequest = () => {
    if (!isLoggedIn) {
      alert('Please login to create a request');
      return;
    }
    navigate('/create-request');
  };

  const handleRequestClick = (requestId: string) => {
    navigate(`/requests/${requestId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'green';
      case 'in_review':
        return 'blue';
      case 'assigned':
        return 'purple';
      case 'completed':
        return 'gray';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getCategoryColor = (category: string) => {
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

  // Filter requests based on search and category
  const filteredRequests = requests?.filter(request => {
    const matchesSearch = !searchTerm || 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.client?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || request.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const formatBudget = (min?: number, max?: number) => {
    if (min && max) {
      return `${min} - ${max} EGLD`;
    } else if (min) {
      return `From ${min} EGLD`;
    } else if (max) {
      return `Up to ${max} EGLD`;
    }
    return 'Budget not specified';
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return 'No deadline';
    
    const date = new Date(deadline);
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold gradient-text mb-2">Open Bids</h1>
            <p className="text-gray-400 text-sm md:text-base">
              Browse project requests from clients looking for skilled providers
            </p>
          </div>
          
          {isLoggedIn ? (
            <Button
              onClick={handleCreateRequest}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-lg w-full md:w-auto"
            >
              <Plus size={18} />
              Create Request
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/unlock')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg text-sm md:text-lg w-full md:w-auto"
            >
              Login to Create Request
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="p-3 md:p-4" title="Search and Filters" reference="#">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 w-full">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search bids, clients, keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm md:text-base bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-sm md:text-base text-white w-full md:max-w-48"
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
                className="text-blue-400 hover:text-blue-300 bg-transparent border-none"
              >
                Clear all filters
              </Button>
            )}
          </div>
        </Card>

        {/* Results count */}
        {filteredRequests && (
          <div>
            <p className="text-gray-400 text-sm md:text-base">
              Found {filteredRequests.length} bid{filteredRequests.length !== 1 ? 's' : ''}
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory && ` in ${selectedCategory}`}
            </p>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="space-y-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-white">Loading open bids...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900 border border-red-500 rounded-md p-4">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-white">Error loading bids. Please try again later.</span>
            </div>
          </div>
        ) : filteredRequests?.length === 0 ? (
          <Card className="p-6 text-center" title="No Results" reference="#">
            <p className="text-gray-400 mb-4">
              {searchTerm || selectedCategory ? 'No bids found matching your criteria.' : 'No open bids available yet.'}
            </p>
            {isLoggedIn && (
              <Button
                onClick={handleCreateRequest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                Create the first request
              </Button>
            )}
          </Card>
        ) : (
          <>
            {/* Mobile Carousel */}
            <div className="md:hidden px-2">
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {filteredRequests.map((request) => {
                  const statusColor = getStatusColor(request.status);
                  const categoryColor = getCategoryColor(request.category);
                  const proposalsCount = request.proposals?.length || 0;
                  
                  return (
                    <div
                      key={request.id}
                      className="min-w-[280px] w-[280px] bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden relative flex-shrink-0 rounded-lg"
                      onClick={() => handleRequestClick(request.id)}
                      style={{
                        borderTopColor: categoryColor,
                        borderTopWidth: '3px'
                      }}
                    >
                      <div 
                        className="py-2 px-3 border-b border-gray-200"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            statusColor === 'green' ? 'bg-green-100 text-green-800' :
                            statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                            statusColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                            statusColor === 'red' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                            <span className="text-xs text-gray-600 truncate max-w-[80px]">
                              {request.client?.username}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 h-8">
                            {request.title}
                          </h3>
                          
                          <p className="text-gray-600 text-xs line-clamp-2 h-6">
                            {request.description}
                          </p>
                          
                          <div className="flex gap-1 flex-wrap">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                              <TagIcon size={10} />
                              {request.category.substring(0, 8)}...
                            </span>
                            
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                              <DollarSign size={10} />
                              {formatBudget(request.budget_min, request.budget_max).substring(0, 12)}...
                            </span>
                          </div>
                          
                          <div className="flex gap-1 flex-wrap">
                            {request.deadline && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs flex items-center gap-1">
                                <Calendar size={10} />
                                {formatDeadline(request.deadline)}
                              </span>
                            )}
                            
                            <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                              proposalsCount > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              <Briefcase size={10} />
                              {proposalsCount}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 pt-1">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-gray-500 text-xs">
                              Expires {new Date(request.expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {filteredRequests.map((request) => {
                const statusColor = getStatusColor(request.status);
                const categoryColor = getCategoryColor(request.category);
                const proposalsCount = request.proposals?.length || 0;
                
                return (
                  <Card
                    key={request.id}
                    className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
                    title="Request"
                    reference="#"
                    onClick={() => handleRequestClick(request.id)}
                  >
                    <div 
                      className="py-2 px-4 border-b border-gray-200"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColor === 'green' ? 'bg-green-100 text-green-800' :
                          statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                          statusColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                          statusColor === 'red' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                          <span className="text-xs text-gray-600">
                            {request.client?.username}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-3">
                        <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
                          {request.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {request.description}
                        </p>
                        
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                            <TagIcon size={12} />
                            {request.category}
                          </span>
                          
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                            <DollarSign size={12} />
                            {formatBudget(request.budget_min, request.budget_max)}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          {request.deadline && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDeadline(request.deadline)}
                            </span>
                          )}
                          
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs flex items-center gap-1">
                            <Briefcase size={12} />
                            {proposalsCount} proposal{proposalsCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 text-xs">
                            Posted {new Date(request.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-gray-500 text-xs">
                              Expires {new Date(request.expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Add bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </div>
  );
};