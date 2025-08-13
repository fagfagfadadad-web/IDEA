import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'components';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { RouteNamesEnum } from 'localConstants';
import { useAllGigs } from '../../hooks/useGigs';
import { useClientRequests } from '../../hooks/useClientRequests';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useTrackGigView } from '../../hooks/useGigViews';
import { useAuth } from '../../context/AuthContext';
import {
  Code,
  Palette,
  Megaphone,
  PenTool,
  Video,
  Cpu,
  Music,
  Briefcase,
  MessageSquare,
  ArrowRight,
  DollarSign,
  Coins,
  FileSearch,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

// Error Boundary component
class ErrorBoundary extends React.Component<React.PropsWithChildren> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 md:p-6 text-center">
          <p className="text-red-500 text-base md:text-lg font-semibold">Something went wrong. Please try refreshing the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Sample ad data
const sampleAd = {
  imageUrl: "https://i.postimg.cc/VNbxByZ5/Nov-projekt.png",
  link: "https://xportal.com",
};

// Service categories with icons
const serviceCategories = [
  { title: "Programming & Tech", icon: <Code size={24} />, slug: "Programming & Tech" },
  { title: "Graphics & Design", icon: <Palette size={24} />, slug: "Graphics & Design" },
  { title: "Digital Marketing", icon: <Megaphone size={24} />, slug: "Digital Marketing" },
  { title: "Writing & Translation", icon: <PenTool size={24} />, slug: "Writing & Translation" },
  { title: "Video & Animation", icon: <Video size={24} />, slug: "Video & Animation" },
  { title: "AI Services", icon: <Cpu size={24} />, slug: "AI Services" },
  { title: "Music & Audio", icon: <Music size={24} />, slug: "Music & Audio" },
  { title: "Business", icon: <Briefcase size={24} />, slug: "Business" },
  { title: "Consulting", icon: <MessageSquare size={24} />, slug: "Consulting" },
];

export const Home = () => {
  const navigate = useNavigate();
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();
  const { user } = useAuth();
  const { data: gigs, isLoading: gigsLoading, error: gigsError } = useAllGigs();
  const { data: requests, isLoading: requestsLoading, error: requestsError } = useClientRequests();
  const { trackView } = useTrackGigView();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const carouselRef = useRef<HTMLDivElement>(null);
  const gigsCarouselRef = useRef<HTMLDivElement>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const [currentGigIndex, setCurrentGigIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll effect for mobile carousel
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isMobile || isUserInteracting) {
      return;
    }

    const scrollAmount = 2;
    const itemWidth = 120;
    const gap = 8;
    const totalWidth = serviceCategories.length * (itemWidth + gap);

    const scroll = () => {
      const currentRef = carouselRef.current;
      if (!currentRef) {
        // Stop the interval if ref becomes null
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      let scrollPosition = currentRef.scrollLeft + scrollAmount;
      if (scrollPosition >= totalWidth - currentRef.clientWidth) {
        scrollPosition = 0;
      }
      currentRef.scrollLeft = scrollPosition;
    };

    // Delay the start of scrolling to ensure DOM is fully mounted
    const timeoutId = setTimeout(() => {
      // Check if ref is still valid before starting interval
      if (carouselRef.current) {
        intervalRef.current = setInterval(scroll, 50);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isMobile, isUserInteracting]);

  const handleUserInteraction = () => {
    setIsUserInteracting(true);
    setTimeout(() => setIsUserInteracting(false), 5000);
  };

  const scrollGigsLeft = () => {
    if (currentGigIndex > 0) {
      setCurrentGigIndex(currentGigIndex - 1);
    }
  };

  const scrollGigsRight = () => {
    if (filteredGigs && currentGigIndex < filteredGigs.length - 1) {
      setCurrentGigIndex(currentGigIndex + 1);
    }
  };

  const handleGigsScroll = () => {
    if (filteredGigs) {
      setShowLeftArrow(currentGigIndex > 0);
      setShowRightArrow(currentGigIndex < filteredGigs.length - 1);
    }
  };

  const filteredGigs = (() => {
    if (!gigs) return [];
    try {
      const filtered = selectedCategory === "all"
        ? gigs
        : gigs.filter((gig) => {
            const gigCategory = gig?.category?.toLowerCase() || "";
            const selectedCategoryLower = selectedCategory.toLowerCase();
            return gigCategory.includes(selectedCategoryLower) || selectedCategoryLower.includes(gigCategory);
          });
      
      // Shuffle array for mobile to show different gigs on each page load
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      return shuffled;
    } catch (error) {
      console.error("Error in filtering gigs:", error);
      return gigs;
    }
  })();

  // Initialize gigs carousel arrows
  useEffect(() => {
    if (isMobile && filteredGigs) {
      handleGigsScroll();
    }
  }, [isMobile, filteredGigs]);

  // Search functionality
  useEffect(() => {
    const searchParam = searchParams.get("search");
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    } else {
      navigate("/search");
    }
  };

  const getStatusColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "programming & tech":
      case "development":
        return "#01c3a8";
      case "graphics & design":
      case "design":
        return "#1890ff";
      case "digital marketing":
      case "marketing":
        return "#ffb741";
      case "writing & translation":
      case "writing":
        return "#ff6f61";
      case "video & animation":
      case "video":
        return "#a259ff";
      case "ai services":
      case "ai":
        return "#00ddeb";
      case "music & audio":
      case "audio":
        return "#ffcc33";
      case "business":
        return "#2ecc71";
      case "consulting":
        return "#e91e63";
      default:
        return "#6b7280";
    }
  };

  const handleGigClick = (gigId: string) => {
    try {
      // Track view before navigation
      trackView(gigId, user?.id || undefined);
      navigate(`/gigs/${gigId}`);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleRequestClick = (requestId: string) => {
    try {
      navigate(`/requests/${requestId}`);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleCategoryClick = (slug: string) => {
    try {
      navigate(`/gigs?category=${encodeURIComponent(slug)}`);
    } catch (error) {
      console.error("Category navigation error:", error);
    }
  };

  const latestRequests = requests?.slice(0, 3) || [];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 font-['Inter',sans-serif] overflow-x-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-50 via-pink-50 to-yellow-50 py-3 md:py-6 border-b border-gray-200 shadow-sm">
          <div className="w-full px-3 md:container md:mx-auto md:px-6 md:max-w-7xl">
            <div className="flex flex-col items-center space-y-3 md:space-y-6">
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 w-full">
                <div className="flex-shrink-0">
                  <img
                    src="https://i.postimg.cc/SQ6SC8H8/3359571c-471b-4fe3-a3bd-eabf94fbdd6b.png"
                    alt="Web3 Development Logo"
                    className="h-12 md:h-24 object-contain transition-transform duration-300 hover:scale-105"
                    onError={(e) => console.error("Logo image error:", e)}
                    onLoad={() => console.log("Logo image loaded successfully")}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm md:w-auto md:max-w-none">
                  <Button
                    onClick={() => navigate('/gigs')}
                    variant="gradient"
                    size="sm"
                    fullWidth={isMobile}
                    aria-label="Browse Gigs"
                  >
                    Browse Gigs
                  </Button>
                  <Button
                    onClick={() => navigate('/requests')}
                    variant="outline"
                    size="sm"
                    fullWidth={isMobile}
                    aria-label="View Open Bids"
                  >
                    Open Bids
                    <FileSearch size={14} />
                  </Button>
                </div>
              </div>

              {/* Search Input */}
              <form onSubmit={handleSearch} className="w-full max-w-sm md:max-w-md">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search gigs or bids..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    aria-label="Search gigs or bids"
                  />
                </div>
              </form>

              {/* Slogan */}
              <p className="text-sm md:text-lg font-semibold gradient-text text-center px-2">
                Everything you need is an IDEA
              </p>
            </div>
          </div>
        </div>

        {/* Service Categories Carousel */}
        <div className="py-3">
          <div className="w-full">
            {/* Mobile Categories */}
            <div className="md:hidden">
              <div
                ref={carouselRef}
                className="flex gap-2 pb-3 px-3 overflow-x-auto scrollbar-hide"
                onTouchStart={handleUserInteraction}
                onMouseDown={handleUserInteraction}
                style={{
                  touchAction: 'pan-x',
                  overscrollBehaviorX: 'contain',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {serviceCategories.map((category, index) => {
                  const borderColor = getStatusColor(category.slug);
                  return (
                    <div
                      key={category.slug}
                      className="min-w-[120px] flex-shrink-0 h-[90px] gradient-border-card bg-white flex flex-col items-center justify-center text-center p-2 cursor-pointer group"
                      style={{ borderColor }}
                      onClick={() => handleCategoryClick(category.slug)}
                      aria-label={`Select ${category.title} category`}
                    >
                      <div className="mb-1 text-gray-800 relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                        {category.icon}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 relative z-10 leading-tight text-center break-words px-1">
                        {category.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Categories */}
            <div className="hidden md:block">
              <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-9 gap-2 pb-4">
                  {serviceCategories.map((category) => {
                    const borderColor = getStatusColor(category.slug);
                    return (
                      <div
                        key={category.slug}
                        className="h-[120px] gradient-border-card bg-white flex flex-col items-center justify-center text-center p-2 cursor-pointer group"
                        style={{ borderColor }}
                        onClick={() => handleCategoryClick(category.slug)}
                        aria-label={`Select ${category.title} category`}
                      >
                        </div>
                        <p className="text-xs font-semibold text-gray-800 relative z-10 leading-tight text-center break-words px-1 hyphens-auto">
                          {category.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Gigs Section */}
        <div className="w-full px-3 md:container md:mx-auto md:px-6 py-6 md:py-12">
          <div className="md:max-w-7xl md:mx-auto space-y-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg md:text-2xl lg:text-3xl font-bold gradient-text">Featured Gigs</h2>
              <div className="flex flex-col gap-2 w-full md:flex-row md:items-center md:justify-between">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 md:w-48"
                  aria-label="Select category"
                >
                  <option value="all">All Categories</option>
                  {serviceCategories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.title}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => navigate('/gigs')}
                  variant="outline"
                  size="sm"
                  fullWidth={isMobile}
                  aria-label="View all gigs"
                >
                  <span>View All Gigs</span>
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>

            {gigsError ? (
              <div className="gradient-card p-4">
                <p className="text-red-500 text-sm font-semibold">Failed to load gigs. Please try again later.</p>
              </div>
            ) : gigsLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : !filteredGigs.length ? (
              <div className="gradient-card p-4 text-center">
                <p className="text-gray-500 text-sm">No gigs available yet. Be the first to create one!</p>
              </div>
            ) : (
              <>
                {/* Mobile Layout - Horizontal Scroll */}
                <div className="md:hidden">
                  <div className="relative">
                    {/* Left Arrow */}
                    {showLeftArrow && (
                      <button
                        onClick={scrollGigsLeft}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-200"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft size={16} className="text-gray-700" />
                      </button>
                    )}
                    
                    {/* Right Arrow */}
                    {showRightArrow && (
                      <button
                        onClick={scrollGigsRight}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all duration-200"
                        aria-label="Scroll right"
                      >
                        <ChevronRight size={16} className="text-gray-700" />
                      </button>
                    )}
                    
                    <div 
                      ref={gigsCarouselRef}
                      className="flex gap-4 pb-3 px-4 overflow-x-auto scrollbar-hide"
                      onScroll={handleGigsScroll}
                      style={{
                        touchAction: 'pan-x',
                        overscrollBehaviorX: 'contain',
                        WebkitOverflowScrolling: 'touch'
                      }}
                    >
                      {filteredGigs.slice(0, 8).map((gig) => {
                        const statusColor = getStatusColor(gig.category || "");
                        const paymentToken = gig.payment_token || "EGLD";
                        const tokenSymbol = paymentToken === "EGLD" ? "EGLD" : "IDEA";
                        const tokenIcon = paymentToken === "EGLD" ? <DollarSign size={14} /> : <Coins size={14} />;
                        const hasNoFees = paymentToken !== "EGLD";

                        return (
                          <div
                            key={gig.id}
                            className="w-full flex-shrink-0 px-2"
                            onClick={() => handleGigClick(gig.id)}
                            style={{
                              borderTopColor: statusColor,
                              borderTopWidth: '3px'
                            }}
                            aria-label={`View gig: ${gig.title || "Untitled Gig"}`}
                          >
                            <div className="gradient-card">
                              <div className="flex justify-between items-center p-4 border-b border-gray-100">
                                <span className="text-xs text-gray-500">
                                  {gig.created_at ? new Date(gig.created_at).toLocaleDateString() : "N/A"}
                                </span>
                                <div className="flex gap-1 flex-wrap">
                                  <span
                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                                  >
                                    {(gig.category || "Unknown").substring(0, 8)}...
                                  </span>
                                  {hasNoFees && (
                                    <span className="px-1 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      No Fees
                                    </span>
                                  )}
                                </div>
                              </div>
  
                              <div className="relative h-40">
                                <img
                                  src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                                  alt={gig.title || "Gig Image"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => ((e.target as HTMLImageElement).src = "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg")}
                                />
                              </div>
  
                              <div className="p-4 space-y-3">
                                <h3 className="text-base font-bold text-gray-800">
                                  {(gig.title || "Untitled Gig").length > 40 
                                    ? `${(gig.title || "Untitled Gig").substring(0, 40)}...` 
                                    : (gig.title || "Untitled Gig")}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {(gig.description || "No description available").length > 60 
                                    ? `${(gig.description || "No description available").substring(0, 60)}...` 
                                    : (gig.description || "No description available")}
                                </p>
                                <p className="text-sm text-gray-700">
                                  Duration: {gig.duration ? `${gig.duration} days` : "N/A"}
                                </p>
                              </div>
  
                              <div className="flex justify-between items-center p-4 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                  {gig.provider?.avatar_url ? (
                                    <img
                                      src={gig.provider.avatar_url}
                                      alt={gig.provider.username || "Provider"}
                                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = target.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className={`w-8 h-8 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-sm font-semibold text-white ${gig.provider?.avatar_url ? 'hidden' : 'flex'}`}
                                  >
                                    {gig.provider?.username?.charAt(0)?.toUpperCase() || "U"}
                                  </div>
                                  <span className="text-sm text-gray-800 truncate max-w-[100px]">
                                    {(gig.provider?.username || "Unknown").substring(0, 8)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {tokenIcon}
                                  <span className="text-base font-bold" style={{ color: statusColor }}>
                                    {gig.price || "N/A"} {tokenSymbol}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Desktop Layout - Pôvodný dizajn z Gigs komponenty */}
                <div className="hidden md:grid grid-cols-5 gap-4">
                  {filteredGigs.slice(0, 8).map((gig) => {
                    const statusColor = getStatusColor(gig.category || "");
                    const paymentToken = gig.payment_token || "EGLD";
                    const tokenSymbol = paymentToken === "EGLD" ? "EGLD" : "IDEA";
                    const tokenIcon = paymentToken === "EGLD" ? <DollarSign size={16} /> : <Coins size={16} />;
                    const hasNoFees = paymentToken !== "EGLD";

                    return (
                      <div
                        key={gig.id}
                        className="gradient-card cursor-pointer group"
                        onClick={() => handleGigClick(gig.id)}
                        style={{
                          borderTopColor: statusColor,
                          borderTopWidth: '3px'
                        }}
                        aria-label={`View gig: ${String(gig.title || "Untitled Gig")}`}
                      >
                        <div className="flex justify-between items-center p-2 border-b border-gray-100">
                          <span className="text-xs text-gray-500 truncate">
                            {gig.created_at ? new Date(String(gig.created_at)).toLocaleDateString() : "N/A"}
                          </span>
                          <div className="flex gap-1">
                            <span
                              className="px-1.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
                            >
                              {String(gig.category || "Unknown").substring(0, 6)}...
                            </span>
                            {hasNoFees && (
                              <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                0%
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="relative h-32">
                          <img
                            src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                            alt={String(gig.title || "Gig Image")}
                            className="w-full h-full object-cover"
                            onError={(e) => ((e.target as HTMLImageElement).src = "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg")}
                          />
                        </div>

                        <div className="p-2 space-y-2">
                          <h3 className="text-sm font-bold text-gray-800">
                            {String(gig.title || "Untitled Gig").length > 50 
                              ? `${String(gig.title || "Untitled Gig").substring(0, 50)}...` 
                              : String(gig.title || "Untitled Gig")}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {String(gig.description || "No description available").length > 80 
                              ? `${String(gig.description || "No description available").substring(0, 80)}...` 
                              : String(gig.description || "No description available")}
                          </p>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-800">
                              Duration: {gig.duration ? `${String(gig.duration)} days` : "N/A"}
                            </p>
                            <div className="flex items-center gap-1">
                              <Eye size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {String(gig.view_count || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-2 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            {gig.provider?.avatar_url ? (
                              <img
                                src={gig.provider.avatar_url}
                                alt={String(gig.provider.username || "Provider")}
                                className="w-6 h-6 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-6 h-6 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full flex items-center justify-center text-xs font-semibold text-white ${gig.provider?.avatar_url ? 'hidden' : 'flex'}`}
                            >
                              {String(gig.provider?.username || "U").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-800 truncate max-w-[60px]">
                              {String(gig.provider?.username || "Unknown").length > 8 
                                ? `${String(gig.provider?.username || "Unknown").substring(0, 8)}...` 
                                : String(gig.provider?.username || "Unknown")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {tokenIcon}
                            <span className="text-sm font-bold" style={{ color: statusColor }}>
                              {String(gig.price || "N/A")} {tokenSymbol}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Advertisement Banner */}
        <div className="w-full px-3 md:container md:mx-auto md:px-6 py-3 md:py-4">
          <div className="md:max-w-7xl md:mx-auto">
            <a href={sampleAd.link} target="_blank" rel="noopener noreferrer">
              <img
                src={sampleAd.imageUrl}
                alt="Advertisement"
                className="w-full max-w-[280px] md:max-w-[516px] h-auto max-h-20 md:max-h-32 object-contain rounded-lg shadow-lg hover:brightness-110 transition-all duration-300 mx-auto block"
                onError={(e) => console.error("Ad image error:", e)}
                onLoad={() => console.log("Ad image loaded successfully")}
              />
            </a>
          </div>
        </div>

        {/* Latest Open Bids Section */}
        <div className="w-full px-3 md:container md:mx-auto md:px-6 py-6 md:py-12">
          <div className="md:max-w-7xl md:mx-auto space-y-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-lg md:text-2xl lg:text-3xl font-bold gradient-text">Latest Open Bids</h2>
              <Button
                onClick={() => navigate('/requests')}
                variant="outline"
                size="sm"
                fullWidth={isMobile}
                aria-label="View all bids"
              >
                <span>View All Bids</span>
                <ArrowRight size={16} />
              </Button>
            </div>

            {requestsError ? (
              <div className="gradient-card p-4">
                <p className="text-red-500 text-sm font-semibold">Failed to load open bids. Please try again later.</p>
              </div>
            ) : requestsLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : !latestRequests.length ? (
              <div className="gradient-card p-4 text-center">
                <p className="text-gray-500 text-sm">No open bids available yet.</p>
              </div>
            ) : (
              <>
                {/* Mobile Layout - Vertical Stack */}
                <div className="md:hidden space-y-4">
                  {latestRequests.map((request) => {
                    const categoryColor = getStatusColor(request.category);
                    const proposalsCount = request.proposals?.length || 0;

                    return (
                      <div
                        key={request.id}
                        className="w-full gradient-card cursor-pointer group"
                        onClick={() => handleRequestClick(request.id)}
                        style={{
                          borderTopColor: categoryColor,
                          borderTopWidth: '3px'
                        }}
                        aria-label={`View bid: ${request.title}`}
                      >
                        <>
                          <div
                            className="py-2 px-3 border-b border-gray-200"
                            style={{ backgroundColor: `${categoryColor}20` }}
                          >
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400">
                                  {request.client?.avatar_url ? (
                                    <>
                                      <img
                                        src={request.client.avatar_url}
                                        alt={request.client.username || "Client"}
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
                                        className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm text-white absolute inset-0"
                                        style={{ display: 'none' }}
                                      >
                                        {request.client?.username?.charAt(0)?.toUpperCase() || "?"}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm text-white">
                                      {request.client?.username?.charAt(0)?.toUpperCase() || "?"}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-600 truncate max-w-[80px]">
                                  {request.client?.username}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 space-y-2">
                            <h3 className="text-sm font-bold text-gray-800">
                                : request.title}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {request.description.length > 60 
                                ? `${request.description.substring(0, 60)}...` 
                                : request.description}
                            </p>
                            
                            <div className="flex gap-1 flex-wrap">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                                <FileSearch size={10} />
                                {request.category.substring(0, 8)}...
                              </span>
                            </div>
                            
                            <div className="flex gap-1 flex-wrap">
                              {(request.budget_min || request.budget_max) && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                                  <DollarSign size={10} />
                                  {request.budget_min && request.budget_max
                                    ? `${request.budget_min}-${request.budget_max}`
                                    : request.budget_min
                                    ? `From ${request.budget_min}`
                                    : `Up to ${request.budget_max}`}
                                </span>
                              )}
                              
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs flex items-center gap-1">
                                <Briefcase size={10} />
                                {proposalsCount}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 pt-1">
                              <Clock size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                Expires {new Date(request.expires_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Layout - Pôvodný dizajn */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
                  {latestRequests.map((request) => {
                    const categoryColor = getStatusColor(request.category);
                    const proposalsCount = request.proposals?.length || 0;

                    return (
                      <div
                        key={request.id}
                        className="gradient-card cursor-pointer group"
                        onClick={() => handleRequestClick(request.id)}
                        style={{ borderTopColor: categoryColor, borderTopWidth: '4px' }}
                        aria-label={`View bid: ${String(request.title)}`}
                      >
                        <div
                          className="py-3 px-4 border-b border-gray-200"
                          style={{ backgroundColor: `${categoryColor}20` }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {String(request.status).charAt(0).toUpperCase() + String(request.status).slice(1)}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden relative bg-gradient-to-r from-indigo-400 to-pink-400">
                                {request.client?.avatar_url ? (
                                  <>
                                    <img
                                      src={request.client.avatar_url}
                                      alt={String(request.client.username || "Client")}
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
                                      className="fallback-avatar w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm text-white absolute inset-0"
                                      style={{ display: 'none' }}
                                    >
                                      {String(request.client?.username || "?").charAt(0).toUpperCase()}
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-pink-400 flex items-center justify-center text-sm text-white">
                                    {String(request.client?.username || "?").charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-600 truncate max-w-[80px]">
                                {String(request.client?.username || "")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <h3 className="text-lg font-bold text-gray-800">
                            {String(request.title).length > 50 
                              ? `${String(request.title).substring(0, 50)}...` 
                              : String(request.title)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {String(request.description).length > 120 
                              ? `${String(request.description).substring(0, 120)}...` 
                              : String(request.description)}
                          </p>
                          <div className="flex gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {String(request.category)}
                            </span>
                            {(request.budget_min || request.budget_max) && (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                                <DollarSign size={14} />
                                {request.budget_min && request.budget_max
                                  ? `${String(request.budget_min)}-${String(request.budget_max)} EGLD`
                                  : request.budget_min
                                  ? `From ${String(request.budget_min)} EGLD`
                                  : `Up to ${String(request.budget_max)} EGLD`}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                              {new Date(String(request.created_at)).toLocaleDateString()}
                            </span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                              {String(proposalsCount)} proposal{proposalsCount !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom padding for mobile navigation */}
        <div className="h-20 md:h-0"></div>
      </div>
    </ErrorBoundary>
  );
};