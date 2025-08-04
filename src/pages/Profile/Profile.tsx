import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Edit, 
  Settings, 
  Star, 
  Briefcase, 
  ShoppingCart, 
  Bell, 
  DollarSign, 
  Coins,
  Calendar,
  Clock,
  Eye,
  MessageCircle,
  Plus,
  Check,
  X
} from 'lucide-react';
import { Button, Card, EmailNotificationsToggle } from 'components';
import { useGetIsLoggedIn } from 'lib';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useGigs, useDeleteGig, useUpdateGigStatus } from '../../hooks/useGigs';
import { useOrders } from '../../hooks/useOrders';
import { useNotifications } from '../../hooks/useNotifications';
import { useAuth } from '../../context/AuthContext';
import { useWindowSize } from '../../hooks/useWindowSize';

export const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  const { data: profile, isLoading, error, refetch } = useProfile(id);
  const { data: gigs } = useGigs();
  const { data: orders } = useOrders();
  const { data: notifications } = useNotifications();
  const updateProfile = useUpdateProfile();
  const deleteGig = useDeleteGig();
  const updateGigStatus = useUpdateGigStatus();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
  const [mobileActiveTab, setMobileActiveTab] = useState('gigs');
  const [activeTab, setActiveTab] = useState(0);
  const [mobileActiveTab, setMobileActiveTab] = useState(0);

  // Set active tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'notifications') setActiveTab(3);
          <div className="space-y-4">
            {/* Always visible Statistics */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-600" />
                Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Briefcase size={14} className="text-blue-600" />
                  </div>
                  <p className="text-xl font-bold text-blue-600">{profile?.gigs?.length || 0}</p>
                  <p className="text-xs text-gray-600">Gigs</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ShoppingCart size={14} className="text-green-600" />
                  </div>
                  <p className="text-xl font-bold text-green-600">{profile?.orders?.length || 0}</p>
                  <p className="text-xs text-gray-600">Orders</p>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star size={14} className="text-yellow-600" />
                  </div>
                  <p className="text-xl font-bold text-yellow-600">{averageRating.toFixed(1)}</p>
                  <p className="text-xs text-gray-600">Rating</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign size={14} className="text-purple-600" />
                  </div>
                  <p className="text-xl font-bold text-purple-600">{(totalEgldEarnings + totalIdaEarnings).toFixed(2)}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
              </div>
            </div>

            {/* Earnings breakdown */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                Earnings
              </h3>
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign size={16} className="text-blue-600" />
                      <span className="font-medium text-gray-800">EGLD</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{totalEgldEarnings.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">After 10% platform fee</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Coins size={16} className="text-purple-600" />
                      <span className="font-medium text-gray-800">IDA</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">{totalIdaEarnings.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">No fees - 100% yours!</p>
                </div>
              </div>
            </div>

            {/* Mobile Tabs Menu */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setMobileActiveTab('gigs')}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    mobileActiveTab === 'gigs'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Gigs
                </button>
                <button
                  onClick={() => setMobileActiveTab('orders')}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    mobileActiveTab === 'orders'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setMobileActiveTab('reviews')}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    mobileActiveTab === 'reviews'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Reviews
                </button>
                <button
                  onClick={() => setMobileActiveTab('settings')}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    mobileActiveTab === 'settings'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Settings
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {/* Gigs Tab */}
                {mobileActiveTab === 'gigs' && (
                  <div className="space-y-4">
                    {profile?.gigs?.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No gigs created yet</p>
                        <Button
                          onClick={() => navigate('/create-gig')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          Create Your First Gig
                        </Button>
                      </div>
                    ) : (
                      profile?.gigs?.map((gig: any) => (
                        <div key={gig.id} className="bg-gray-50 rounded-lg overflow-hidden">
                          {/* Gig Header */}
                          <div className="p-3 border-b border-gray-200">
                            <div className="flex justify-between items-start">
                              <span className="text-xs text-gray-500">
                                {new Date(gig.created_at).toLocaleDateString()}
                              </span>
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                {gig.category}
                              </span>
                            </div>
                          </div>

                          {/* Gig Image */}
                          <div className="relative h-32">
                            <img
                              src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                              alt={gig.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Gig Content */}
                          <div className="p-3 space-y-2">
                            <h4 className="font-bold text-gray-800">{gig.title}</h4>
                            <p className="text-sm text-gray-600 line-clamp-2">{gig.description}</p>
                            <p className="text-sm text-gray-800">Duration: {gig.duration} days</p>
                          </div>

                          {/* Gig Footer with Actions */}
                          <div className="p-3 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-lg font-bold text-blue-600">
                                {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                gig.status === 'active' ? 'bg-green-100 text-green-800' :
                                gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {gig.status}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => navigate(`/gigs/${gig.id}/edit`)}
                                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"
                              >
                                <Edit size={14} />
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDeleteGig(gig.id)}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-1"
                              >
                                <Trash2 size={14} />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Orders Tab */}
                {mobileActiveTab === 'orders' && (
                  <div className="space-y-4">
                    {profile?.orders?.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600 mb-4">No orders yet</p>
                        <Button
                          onClick={() => navigate('/gigs')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          Browse Gigs
                        </Button>
                      </div>
                    ) : (
                      profile?.orders?.map((order: any) => {
                        const isClient = order.client_id === profile?.id;
                        const isProvider = order.gig?.provider_id === profile?.id;
                        
                        return (
                          <div key={order.id} className="bg-gray-50 rounded-lg overflow-hidden">
                            {/* Order Header */}
                            <div className="p-3 border-b border-gray-200">
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-gray-500">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                                <div className="flex gap-1">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                    Order #{order.id.slice(-6)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Order Content */}
                            <div className="p-3 space-y-3">
                              <h4 className="font-bold text-gray-800">{order.gig?.title || 'Custom Project'}</h4>
                              
                              {/* Progress Bar */}
                              <div>
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span>
                                    {order.status === 'completed' ? '100%' :
                                     order.status === 'delivered' ? '75%' :
                                     order.status === 'in_progress' ? '50%' : '25%'}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      order.status === 'completed' ? 'bg-green-500' :
                                      order.status === 'delivered' ? 'bg-yellow-500' :
                                      order.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                                    }`}
                                    style={{ 
                                      width: order.status === 'completed' ? '100%' :
                                             order.status === 'delivered' ? '75%' :
                                             order.status === 'in_progress' ? '50%' : '25%'
                                    }}
                                  ></div>
                                </div>
                              </div>

                              {/* Participants */}
                              <div className="flex justify-between items-center">
                                {/* Client */}
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User size={12} className="text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Client</p>
                                    <p className="text-sm font-medium text-gray-800">
                                      {order.client?.username || 'Unknown'}
                                    </p>
                                  </div>
                                </div>

                                {/* Provider */}
                                <div className="flex items-center gap-2">
                                  <div>
                                    <p className="text-xs text-gray-500 text-right">Provider</p>
                                    <p className="text-sm font-medium text-gray-800">
                                      {order.gig?.provider?.username || 'Unknown'}
                                    </p>
                                  </div>
                                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                    <User size={12} className="text-purple-600" />
                                  </div>
                                </div>
                              </div>

                              {/* Amount */}
                              <div className="text-center">
                                <span className="text-lg font-bold text-green-600">
                                  {order.amount} {order.payment_token || 'EGLD'}
                                </span>
                              </div>
                            </div>

                            {/* Order Footer */}
                            <div className="p-3 border-t border-gray-200">
                              <Button
                                onClick={() => navigate(`/orders/${order.id}`)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {mobileActiveTab === 'reviews' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="flex justify-center items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            fill={star <= averageRating ? '#FFD700' : 'transparent'}
                            color={star <= averageRating ? '#FFD700' : '#D1D5DB'}
                          />
                        ))}
                      </div>
                      <p className="text-lg font-bold text-gray-800">{averageRating.toFixed(1)} / 5</p>
                      <p className="text-sm text-gray-600">Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                    </div>
                    {totalReviews === 0 && (
                      <p className="text-gray-600 text-center py-4">No reviews yet</p>
                    )}
                  </div>
                )}

                {/* Settings Tab */}
                {mobileActiveTab === 'settings' && (
                  <div className="space-y-4">
                    {isOwnProfile ? (
                      <div className="space-y-4">
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                        >
                          <Edit size={16} />
                          Edit Profile
                        </Button>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <EmailNotificationsToggle enabled={profile?.email_notifications_enabled || false} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-center py-4">Settings not available for other users</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white" title="Gigs" reference="#">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Gigs</p>
                  <p className="text-2xl font-bold">{totalGigs}</p>
                  <p className="text-blue-100 text-sm">{activeGigs} active</p>
                </div>
                <Briefcase size={32} className="text-blue-200" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white" title="Orders" reference="#">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Orders</p>
                  <p className="text-2xl font-bold">{totalOrders}</p>
                  <p className="text-green-100 text-sm">{completedOrders} completed</p>
                </div>
                <ShoppingCart size={32} className="text-green-200" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white" title="Rating" reference="#">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100">Avg Rating</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          fill={star <= averageRating ? '#FFD700' : 'transparent'}
                          color={star <= averageRating ? '#FFD700' : '#FFF'}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-yellow-100 text-sm">{allReviews.length} reviews</p>
                </div>
                <Star size={32} className="text-yellow-200" />
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white" title="Earnings" reference="#">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Earned</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <DollarSign size={16} className="text-blue-300" />
                      <p className="text-lg font-bold">{egldEarnings.toFixed(2)} EGLD</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Coins size={16} className="text-purple-300" />
                      <p className="text-lg font-bold">{idaEarnings.toFixed(2)} IDA</p>
                    </div>
                  </div>
                </div>
                <DollarSign size={32} className="text-purple-200" />
              </div>
            </Card>
          </div>

          {/* Earnings Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white" title="EGLD Earnings" reference="#">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign size={24} />
                    <h3 className="text-xl font-bold">EGLD Earnings</h3>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
                    10% fee
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-100">Total Earned:</span>
                    <span className="font-bold">{egldEarnings.toFixed(4)} EGLD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-100">Completed Orders:</span>
                    <span>{orders?.filter(o => o.status === 'completed' && o.payment_token === 'EGLD').length || 0}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white" title="IDA Earnings" reference="#">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins size={24} />
                    <h3 className="text-xl font-bold">IDA Earnings</h3>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    No fees - 100% yours!
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-purple-100">Total Earned:</span>
                    <span className="font-bold">{idaEarnings.toFixed(4)} IDA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-100">Completed Orders:</span>
                    <span>{orders?.filter(o => o.status === 'completed' && (o.payment_token === 'IDA-f9bc1d' || o.payment_token === 'IDA')).length || 0}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Card className="overflow-hidden" title="Profile Tabs" reference="#">
            <div className="border-b border-gray-700">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400 bg-gray-800'
                        : 'border-transparent text-gray-400 hover:text-blue-400'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              {activeTab === 0 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">Profile Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                      <div className="space-y-3">
                        {orders?.slice(0, 3).map((order) => (
                          <div key={order.id} className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-white font-medium">{order.gig?.title || 'Custom Project'}</p>
                            <p className="text-gray-400 text-sm">{order.amount} {order.payment_token || 'EGLD'}</p>
                            <p className="text-gray-400 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-4">Top Gigs</h3>
                      <div className="space-y-3">
                        {gigs?.slice(0, 3).map((gig) => (
                          <div key={gig.id} className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-white font-medium">{gig.title}</p>
                            <p className="text-gray-400 text-sm">{gig.price} {gig.payment_token || 'EGLD'}</p>
                            <p className="text-gray-400 text-sm">{gig.category}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">My Gigs ({totalGigs})</h2>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Create Gig
                      </Button>
                    )}
                  </div>
                  
                  {gigs?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-4">No gigs created yet.</p>
                      {isOwnProfile && (
                        <Button
                          onClick={() => navigate('/create-gig')}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                          Create your first gig
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {gigs?.map((gig) => (
                        <Card
                          key={gig.id}
                          className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors"
                          title="Gig"
                          reference="#"
                          onClick={() => navigate(`/gigs/${gig.id}`)}
                        >
                          <img
                            src={gig.media_urls?.images?.[0] || "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg"}
                            alt={gig.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-bold text-white line-clamp-2">{gig.title}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                gig.status === 'active' ? 'bg-green-100 text-green-800' :
                                gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {gig.status}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2">{gig.description}</p>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                {gig.payment_token === 'EGLD' ? <DollarSign size={16} /> : <Coins size={16} />}
                                <span className="text-blue-400 font-bold">
                                  {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                                </span>
                              </div>
                              <span className="text-gray-400 text-sm">{gig.duration} days</span>
                            </div>
                            
                            {isOwnProfile && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/gigs/${gig.id}/edit`);
                                  }}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateGigStatus(gig.id, gig.status === 'active' ? 'paused' : 'active');
                                  }}
                                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-3 rounded text-sm"
                                >
                                  {gig.status === 'active' ? 'Pause' : 'Activate'}
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteGig(gig.id);
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm"
                                >
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">My Orders ({totalOrders})</h2>
                  
                  {orders?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders?.map((order) => (
                        <Card
                          key={order.id}
                          className="bg-gray-800 p-6 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                          title="Order"
                          reference="#"
                          onClick={() => navigate(`/orders/${order.id}`)}
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-bold text-white">
                                {order.gig?.title || 'Custom Project'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                {order.payment_token === 'EGLD' ? <DollarSign size={16} /> : <Coins size={16} />}
                                <span className="text-blue-400 font-bold">
                                  {order.amount} {order.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                                </span>
                              </div>
                              <span className="text-gray-400 text-sm">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {order.reviews && order.reviews.length > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      size={16}
                                      fill={star <= order.reviews[0].rating ? '#FFD700' : 'transparent'}
                                      color={star <= order.reviews[0].rating ? '#FFD700' : '#6B7280'}
                                    />
                                  ))}
                                </div>
                                <span className="text-gray-400 text-sm">
                                  {order.reviews[0].rating}/5
                                </span>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">Notifications ({unreadNotifications} unread)</h2>
                  
                  {notifications?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No notifications yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications?.map((notification) => (
                        <Card
                          key={notification.id}
                          className={`p-4 rounded-lg ${
                            !notification.read ? 'bg-blue-900 border-l-4 border-l-blue-500' : 'bg-gray-800'
                          }`}
                          title="Notification"
                          reference="#"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h3 className="text-white font-medium">{notification.title}</h3>
                              {!notification.read && (
                                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">{notification.content}</p>
                            <p className="text-gray-500 text-xs">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 4 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white">Settings</h2>
                  
                  {isOwnProfile ? (
                    <div className="space-y-6">
                      <Card className="p-6" title="Profile Settings" reference="#">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">Username</label>
                            <input
                              type="text"
                              value={editForm.username}
                              onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                            <input
                              type="text"
                              value={editForm.full_name}
                              onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">Bio</label>
                            <textarea
                              value={editForm.bio}
                              onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                              rows={4}
                              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">Avatar URL</label>
                            <input
                              type="url"
                              value={editForm.avatar_url}
                              onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <EmailNotificationsToggle enabled={editForm.email_notifications_enabled} />
                          <Button
                            onClick={handleEditSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
                            disabled={updateProfile.isLoading}
                          >
                            {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">You can only edit your own profile.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Mobile version
  const mobileTabs = [
    { id: 0, label: 'Gigs', icon: <Briefcase size={16} /> },
    { id: 1, label: 'Orders', icon: <ShoppingCart size={16} /> },
    { id: 2, label: 'Reviews', icon: <Star size={16} /> },
    { id: 3, label: 'Notifications', icon: <Bell size={16} /> },
    { id: 4, label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-6">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-4 border-white shadow-lg">
            {profile.avatar_url ? (
              <>
                <img
                  src={profile.avatar_url}
                  alt={profile.username || "Profile"}
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
                  className="fallback-avatar w-full h-full bg-gray-600 flex items-center justify-center text-2xl text-white absolute inset-0"
                  style={{ display: 'none' }}
                >
                  {profile.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center text-2xl text-white">
                {profile.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-white mb-1">
            {profile.full_name || profile.username}
          </h1>
          <p className="text-indigo-100 text-sm">@{profile.username}</p>
          {profile.bio && (
            <p className="text-indigo-100 text-sm mt-2 px-4">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Mobile Stats Grid */}
      <div className="px-4 -mt-6 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={16} className="text-blue-600" />
              <span className="text-gray-600 text-sm font-medium">Gigs</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalGigs}</p>
            <p className="text-gray-500 text-xs">{activeGigs} active</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart size={16} className="text-green-600" />
              <span className="text-gray-600 text-sm font-medium">Orders</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{totalOrders}</p>
            <p className="text-gray-500 text-xs">{completedOrders} done</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-yellow-600" />
              <span className="text-gray-600 text-sm font-medium">Rating</span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold text-gray-800">{averageRating.toFixed(1)}</p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={12}
                    fill={star <= averageRating ? '#FFD700' : 'transparent'}
                    color={star <= averageRating ? '#FFD700' : '#D1D5DB'}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-500 text-xs">{allReviews.length} reviews</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={16} className="text-purple-600" />
              <span className="text-gray-600 text-sm font-medium">Earned</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <DollarSign size={12} className="text-blue-600" />
                <p className="text-sm font-bold text-gray-800">{egldEarnings.toFixed(1)} EGLD</p>
              </div>
              <div className="flex items-center gap-1">
                <Coins size={12} className="text-purple-600" />
                <p className="text-sm font-bold text-gray-800">{idaEarnings.toFixed(1)} IDA</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Earnings Cards */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <DollarSign size={20} />
                <h3 className="font-bold">EGLD Earnings</h3>
              </div>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                10% fee
              </span>
            </div>
            <p className="text-2xl font-bold mb-1">{egldEarnings.toFixed(4)} EGLD</p>
            <p className="text-blue-100 text-sm">
              {orders?.filter(o => o.status === 'completed' && o.payment_token === 'EGLD').length || 0} completed orders
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins size={20} />
                <h3 className="font-bold">IDA Earnings</h3>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                0% fee
              </span>
            </div>
            <p className="text-2xl font-bold mb-1">{idaEarnings.toFixed(4)} IDA</p>
            <p className="text-purple-100 text-sm">
              {orders?.filter(o => o.status === 'completed' && (o.payment_token === 'IDA-f9bc1d' || o.payment_token === 'IDA')).length || 0} completed orders
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto scrollbar-hide bg-gray-50">
            {mobileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMobileActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  mobileActiveTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 bg-white'
                    : 'border-transparent text-gray-500'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {mobileActiveTab === 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">My Gigs ({totalGigs})</h3>
                  {isOwnProfile && (
                    <Button
                      onClick={() => navigate('/create-gig')}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Plus size={14} />
                    </Button>
                  )}
                </div>
                
                {gigs?.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-3">No gigs yet</p>
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate('/create-gig')}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Create Gig
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gigs?.map((gig) => (
                      <div
                        key={gig.id}
                        className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/gigs/${gig.id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800 text-sm line-clamp-1">{gig.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            gig.status === 'active' ? 'bg-green-100 text-green-800' :
                            gig.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {gig.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs line-clamp-2 mb-2">{gig.description}</p>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            {gig.payment_token === 'EGLD' ? <DollarSign size={12} /> : <Coins size={12} />}
                            <span className="text-indigo-600 font-bold text-sm">
                              {gig.price} {gig.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                            </span>
                          </div>
                          <span className="text-gray-500 text-xs">{gig.duration}d</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mobileActiveTab === 1 && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">My Orders ({totalOrders})</h3>
                
                {orders?.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders?.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800 text-sm line-clamp-1">
                            {order.gig?.title || 'Custom Project'}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'delivered' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            {order.payment_token === 'EGLD' ? <DollarSign size={12} /> : <Coins size={12} />}
                            <span className="text-indigo-600 font-bold text-sm">
                              {order.amount} {order.payment_token === 'EGLD' ? 'EGLD' : 'IDA'}
                            </span>
                          </div>
                          <span className="text-gray-500 text-xs">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mobileActiveTab === 2 && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">Reviews ({allReviews.length})</h3>
                
                {allReviews.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allReviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                fill={star <= review.rating ? '#FFD700' : 'transparent'}
                                color={star <= review.rating ? '#FFD700' : '#D1D5DB'}
                              />
                            ))}
                          </div>
                          <span className="text-gray-500 text-xs">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mobileActiveTab === 3 && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">Notifications ({unreadNotifications} unread)</h3>
                
                {notifications?.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications?.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`border rounded-lg p-3 ${
                          !notification.read ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-gray-800 text-sm">{notification.title}</h4>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-600 text-xs line-clamp-2">{notification.content}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mobileActiveTab === 4 && (
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800">Settings</h3>
                
                {isOwnProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Username</label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Bio</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Avatar URL</label>
                      <input
                        type="url"
                        value={editForm.avatar_url}
                        onChange={(e) => setEditForm({...editForm, avatar_url: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <EmailNotificationsToggle enabled={editForm.email_notifications_enabled} />
                    <Button
                      onClick={handleEditSubmit}
                      fullWidth
                      className="bg-indigo-600 hover:bg-indigo-700 text-white py-3"
                      disabled={updateProfile.isLoading}
                    >
                      {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">You can only edit your own profile.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};