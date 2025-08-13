import { useState, useEffect } from 'react';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { supabase } from '../lib/supabase';
import { Address } from '@multiversx/sdk-core';
import { useEmailTemplates, useSendEmailNotification } from './useEmailNotifications';

// Define the provider type explicitly
interface Provider {
  id?: string;
  username?: string;
  avatar_url?: string;
  wallet_address: string;
}

interface GigWithProviderWallet {
  id: string;
  title: string;
  provider_id: string;
  payment_token: string;
  provider: Provider;
}

interface Order {
  id: string;
  gig_id: string;
  gig: GigWithProviderWallet;
  client: {
    id?: string;
    username: string;
    avatar_url: string;
    wallet_address: string;
    email?: string;
    full_name?: string;
  };
  reviews: any[];
  created_at: string;
  amount: number;
  status: string;
  payment_status: string;
  work_status: string;
  client_address: string;
  provider_address: string;
  status_updated_at: string;
  payment_token: string;
  deadline?: string;
  requirements?: any;
  transaction_hash?: string;
}

export const sendNotification = async ({
  user_id,
  type,
  title,
  content,
  data,
  sendEmail = false,
  userEmail,
}: {
  user_id: string;
  type: string;
  title: string;
  content: string;
  data?: any;
  sendEmail?: boolean;
  userEmail?: string;
}) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        content,
        data: data || {},
        read: false,
      });

    if (error) throw error;

    // Send email notification if requested and email is provided
    if (sendEmail && userEmail) {
      try {
        // Get email templates
        const { getOrderCreatedTemplate, getMessageReceivedTemplate, getPaymentReleasedTemplate } = useEmailTemplates();
        
        let emailSubject = title;
        let emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${title}</h2>
            <p style="color: #666; line-height: 1.6;">${content}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an automated notification from IDEA Platform.<br>
              Visit <a href="https://xidea.app">xidea.app</a> to manage your account.
            </p>
          </div>
        `;

        // Use specific template based on notification type
        switch (type) {
          case 'order_created':
            if (data?.clientName && data?.gigTitle && data?.amount && data?.paymentToken && data?.orderId) {
              const template = getOrderCreatedTemplate({
                clientName: data.clientName,
                gigTitle: data.gigTitle,
                amount: data.amount,
                paymentToken: data.paymentToken,
                orderId: data.orderId
              });
              emailSubject = template.subject;
              emailHtml = template.html;
            }
            break;
          case 'message_received':
            if (data?.senderName && data?.gigTitle && data?.messagePreview && data?.orderId) {
              const template = getMessageReceivedTemplate({
                senderName: data.senderName,
                gigTitle: data.gigTitle,
                messagePreview: data.messagePreview,
                orderId: data.orderId
              });
              emailSubject = template.subject;
              emailHtml = template.html;
            }
            break;
          case 'payment_released':
            if (data?.providerName && data?.gigTitle && data?.amount && data?.paymentToken && data?.orderId) {
              const template = getPaymentReleasedTemplate({
                providerName: data.providerName,
                gigTitle: data.gigTitle,
                amount: data.amount,
                paymentToken: data.paymentToken,
                orderId: data.orderId
              });
              emailSubject = template.subject;
              emailHtml = template.html;
            }
            break;
          default:
            // Use default template for other notification types
            break;
        }

        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: userEmail,
            subject: emailSubject,
            html: emailHtml
          }
        });

        if (emailError) {
          console.error('Error sending email notification:', emailError);
        } else {
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    } else {
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const useOrders = () => {
  const [data, setData] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isLoggedIn = useGetIsLoggedIn();
  const { address } = useGetAccount();

  useEffect(() => {
    fetchOrders();
  }, [address, isLoggedIn]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      if (!isLoggedIn || !address) {
        setData([]);
        return;
      }


      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .maybeSingle();


      if (!user) {
        setData([]);
        return;
      }

      const filterQuery = `client_id.eq.${user.id},provider_address.eq.${address}`;

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          gig:gigs(
            id,
            title,
            payment_token,
            provider:users!gigs_provider_id_fkey(id, username, avatar_url, wallet_address)
          ),
          client:users!orders_client_id_fkey(id, username, avatar_url, wallet_address, email, full_name),
          reviews(*)
        `)
        .or(filterQuery)
        .order('created_at', { ascending: false });


      if (error) throw error;

      setData(orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refetch: fetchOrders,
  };
};

export const useCreateOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useGetAccount();
  const { getOrderCreatedTemplate } = useEmailTemplates();

  const mutateAsync = async (orderData: {
    gig_id: string;
    amount: number;
    requirements?: any;
    deadline?: string;
    payment_token?: string;
  }) => {
    setIsLoading(true);
    try {
      if (!address) {
        throw new Error('Please connect your wallet first');
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', address)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user:', userError);
        throw new Error(`Failed to fetch user: ${userError.message}`);
      }

      if (!user) {
        throw new Error('User not found. Please complete your profile first.');
      }

      const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .select(`
          id,
          provider_id,
          payment_token,
          provider:users!gigs_provider_id_fkey(id, username, avatar_url, wallet_address)
        `)
        .eq('id', orderData.gig_id)
        .single();

      if (gigError) {
        console.error('Error fetching gig:', gigError);
        throw new Error(`Failed to fetch gig: ${gigError.message}`);
      }

      // Use unknown as an intermediate type to safely assert to Provider
      const providerAddress = ((gig?.provider as unknown) as Provider | null)?.wallet_address;

      if (!providerAddress || !isValidAddress(providerAddress)) {
        console.error('Invalid or missing provider address for gig:', {
          gigId: orderData.gig_id,
          providerAddress,
        });
        throw new Error('Provider address not found or invalid for gig');
      }

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          gig_id: orderData.gig_id,
          client_id: user.id,
          amount: orderData.amount,
          requirements: orderData.requirements || {},
          deadline: orderData.deadline,
          payment_token: gig?.payment_token || orderData.payment_token || 'EGLD',
          status: 'pending_approval',
          payment_status: 'pending',
          work_status: 'pending',
          client_address: address,
          provider_address: providerAddress,
          status_updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          gig:gigs(id, title, payment_token),
          client:users!orders_client_id_fkey(id, username, email, avatar_url, full_name)
        `)
        .single();

      if (error) throw error;

      // Send email notification to provider if they have email notifications enabled
      try {
        // Get provider details including email settings
        const { data: providerData, error: providerError } = await supabase
          .from('users')
          .select('id, username, email, email_notifications_enabled, full_name')
          .eq('id', gig.provider_id)
          .single();

        if (!providerError && providerData?.email && providerData?.email_notifications_enabled) {
          // Prepare template data for order created email
          const templateData = {
            clientName: order.client?.username || order.client?.full_name || 'A client',
            gigTitle: order.gig?.title || 'Custom Project',
            amount: orderData.amount,
            paymentToken: gig?.payment_token || orderData.payment_token || 'EGLD',
            orderId: order.id
          };
          
          await sendNotification({
            user_id: providerData.id,
            type: 'order_created',
            title: `New Order - ${templateData.gigTitle}`,
            content: `You have received a new order from ${templateData.clientName} for ${templateData.amount} ${templateData.paymentToken}.`,
            data: templateData,
            sendEmail: true,
            userEmail: providerData.email
          });
          
        } else {
        }
      } catch (notificationError) {
        console.error('Error sending order created notification:', notificationError);
        // Don't fail the order creation if notification fails
      }

      return order;
    } catch (err) {
      console.error('Error creating order:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const isValidAddress = (addr: string | undefined): boolean => {
    if (!addr) return false;
    try {
      new Address(addr);
      return true;
    } catch {
      return false;
    }
  };

  return {
    mutateAsync,
    isLoading,
  };
};

export const useOrderById = (orderId: string) => {
  const [data, setData] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const { data: order, error } = await supabase
          .from('orders')
          .select(`
            *,
            client:users!orders_client_id_fkey(id, username, avatar_url, full_name, wallet_address),
            gig:gigs!orders_gig_id_fkey(
              id,
              title,
              payment_token,
              provider_id,
              provider:users!gigs_provider_id_fkey(id, username, avatar_url, full_name, wallet_address)
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('Order not found:', orderId);
            setData(null);
            setError(null);
            return;
          }

          console.error('Supabase error fetching order:', error);
          throw new Error(`Failed to fetch order: ${error.message}`);
        }

        if (!order) throw new Error('Order not found');
        setData(order);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return {
    data,
    isLoading,
    error,
  };
};

export const useUpdateOrderStatus = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { getPaymentReleasedTemplate } = useEmailTemplates();

  const mutateAsync = async ({ orderId, status, amount }: { orderId: string; status: string; amount?: number }) => {
    setIsLoading(true);
    try {
      const updateData: any = {
        status,
        status_updated_at: new Date().toISOString(),
      };

      if (amount !== undefined) {
        updateData.amount = amount;
      }

      const { data: order, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;

      // Send email notifications based on status change
      try {
        // Get order details with client and provider information
        const { data: orderDetails, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            amount,
            payment_token,
            client_id,
            gig:gigs!orders_gig_id_fkey(
              id,
              title,
              provider_id,
               provider:users!gigs_provider_id_fkey(id, username, email, email_notifications_enabled, full_name)
            ),
            client:users!orders_client_id_fkey(id, username, email, email_notifications_enabled, full_name)
          `)
          .eq('id', orderId)
          .single();

        if (orderError) {
          console.error('Error fetching order details for notification:', orderError);
          return order;
        }

        // Type assertion to fix TypeScript issues
        const client = orderDetails.client as any;
        const gig = orderDetails.gig as any;
        const provider = Array.isArray(gig?.provider) ? gig.provider[0] : gig?.provider;
        // Handle different status changes
        switch (status) {
          case 'delivered':
            // Notify client that work has been delivered
            if (client?.email && client?.email_notifications_enabled) {
              await sendNotification({
                user_id: client.id,
                type: 'work_delivered',
                title: `Work Delivered - ${gig?.title || 'Custom Project'}`,
                content: `The provider has delivered the work for your order. Please review and release the payment if you are satisfied.`,
                data: {
                  orderId: orderId,
                  gigTitle: gig?.title || 'Custom Project',
                  providerName: provider?.username || provider?.full_name || 'Provider'
                },
                sendEmail: true,
                userEmail: client.email
              });
              console.log('DEBUG: Work delivered email sent to client');
            }
            break;
            
          case 'completed':
            // Notify both parties that order is completed
            
            // Notify provider about completion
            if (provider?.email && provider?.email_notifications_enabled) {
              const paymentTemplate = getPaymentReleasedTemplate({
                providerName: provider.username || provider.full_name || 'Provider',
                gigTitle: gig?.title || 'Custom Project',
                amount: orderDetails.amount,
                paymentToken: orderDetails.payment_token || 'EGLD',
                orderId: orderId
              });
              
              await sendNotification({
                user_id: provider.id,
                type: 'payment_released',
                title: paymentTemplate.subject,
                content: `Payment for order "${gig?.title || 'Custom Project'}" has been successfully released.`,
                data: {
                  providerName: provider.username || provider.full_name || 'Provider',
                  gigTitle: gig?.title || 'Custom Project',
                  amount: orderDetails.amount,
                  paymentToken: orderDetails.payment_token || 'EGLD',
                  orderId: orderId
                },
                sendEmail: true,
                userEmail: provider.email
              });
            }
            
            // Notify client about completion
            if (client?.email && client?.email_notifications_enabled) {
              await sendNotification({
                user_id: client.id,
                type: 'order_completed',
                title: `Order Completed - ${gig?.title || 'Custom Project'}`,
                content: `Your order has been completed successfully. You can now leave a review for the provider.`,
                data: {
                  orderId: orderId,
                  gigTitle: gig?.title || 'Custom Project',
                  providerName: provider?.username || provider?.full_name || 'Provider'
                },
                sendEmail: true,
                userEmail: client.email
              });
            }
            break;
            
          case 'in_progress':
            // Notify provider that payment has been made and work can start
            
            if (provider?.email && provider?.email_notifications_enabled) {
              await sendNotification({
                user_id: provider.id,
                type: 'order_started',
                title: `Order Started - ${gig?.title || 'Custom Project'}`,
                content: `Payment has been received and escrowed. You can now start working on the order.`,
                data: {
                  orderId: orderId,
                  gigTitle: gig?.title || 'Custom Project',
                  clientName: client?.username || client?.full_name || 'Client',
                  amount: orderDetails.amount,
                  paymentToken: orderDetails.payment_token || 'EGLD'
                },
                sendEmail: true,
                userEmail: provider.email
              });
            }
            break;
            
          default:
            break;
        }
      } catch (notificationError) {
        console.error('Error sending status change notification:', notificationError);
        // Don't fail the status update if notification fails
      }

      return order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutateAsync,
    isLoading,
  };
};