import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';
import { useMessages } from '../../hooks/useMessages';
import { useProfile } from '../../hooks/useProfile';
import { OrderChat } from '../../components/OrderChat';
import { ReviewModal } from '../../components/ReviewModal';
import { DisputeModal } from '../../components/DisputeModal';
import { Button } from '../../components/Button';
import { Loader } from '../../components/Loader';
import { formatDistanceToNow } from 'date-fns';
import { isValidAddress } from '../../utils/errorParse';

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { orders, updateOrderStatus, isLoading } = useOrders();
  const { messages } = useMessages(id);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [providerAddress, setProviderAddress] = useState<string>('');

  const order = orders?.find(o => o.id === id);

  const fetchProviderAddress = async () => {
    if (!order?.gig_id) return;

    try {
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          provider_id,
          users!gigs_provider_id_fkey (
            wallet_address
          )
        `)
        .eq('id', order.gig_id)
        .single();

      if (error) throw error;

      const walletAddress = Array.isArray(data?.users) 
        ? data.users[0]?.wallet_address 
        : data?.users?.wallet_address;
      
      console.log('Fetched provider data:', { data, walletAddress });

      if (!isValidAddress(walletAddress)) {
        throw new Error('Provider wallet address not found or invalid');
      }

      setProviderAddress(walletAddress);
    } catch (error) {
      console.error('Error fetching provider address:', error);
    }
  };

  useEffect(() => {
    if (order) {
      fetchProviderAddress();
    }
  }, [order]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;
    
    try {
      await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const canReview = order?.status === 'completed' && order?.client_id === profile?.id;
  const canDispute = ['in_progress', 'delivered'].includes(order?.status || '') && 
                     (order?.client_id === profile?.id);
  const isProvider = order?.gig_id && profile?.id;
  const isClient = order?.client_id === profile?.id;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order #{order.id.slice(0, 8)}</h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {Number(order.amount).toFixed(4)} {order.payment_token || 'EGLD'}
            </p>
            <p className="text-sm text-gray-500">
              Created {formatDistanceToNow(new Date(order.created_at))} ago
            </p>
          </div>
        </div>

        {order.deadline && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Deadline:</span> {new Date(order.deadline).toLocaleDateString()}
            </p>
          </div>
        )}

        {order.requirements && Object.keys(order.requirements).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(order.requirements, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {isProvider && order.status === 'pending' && (
            <Button onClick={() => handleStatusUpdate('in_progress')}>
              Accept Order
            </Button>
          )}
          
          {isProvider && order.status === 'in_progress' && (
            <Button onClick={() => handleStatusUpdate('delivered')}>
              Mark as Delivered
            </Button>
          )}
          
          {isClient && order.status === 'delivered' && (
            <Button onClick={() => handleStatusUpdate('completed')}>
              Accept Delivery
            </Button>
          )}
          
          {canReview && (
            <Button onClick={() => setShowReviewModal(true)}>
              Leave Review
            </Button>
          )}
          
          {canDispute && (
            <Button 
              variant="outline" 
              onClick={() => setShowDisputeModal(true)}
            >
              Open Dispute
            </Button>
          )}
        </div>
      </div>

      <OrderChat orderId={order.id} />

      {showReviewModal && (
        <ReviewModal
          orderId={order.id}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      {showDisputeModal && (
        <DisputeModal
          orderId={order.id}
          onClose={() => setShowDisputeModal(false)}
        />
      )}
    </div>
  );
};