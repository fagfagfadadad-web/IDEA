export const useCreateOrder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useGetAccount();

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

      // Get current user by wallet address
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

      // Get gig details for provider address
      const { data: gig, error: gigError } = await supabase
        .from('gigs')
        .select('provider_id, users!provider_id(wallet_address)')
        .eq('id', orderData.gig_id)
        .single();

      if (gigError) {
        console.error('Error fetching gig:', gigError);
        throw new Error(`Failed to fetch gig: ${gigError.message}`);
      }

      const providerAddress = gig?.users?.wallet_address;
      if (!providerAddress || !isValidAddress(providerAddress)) {
        console.error('Invalid or missing provider address for gig:', { gigId: orderData.gig_id, providerAddress });
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
          payment_token: orderData.payment_token || 'EGLD',
          status: 'pending_approval',
          payment_status: 'pending',
          work_status: 'pending',
          client_address: address,
          provider_address: providerAddress
        })
        .select(`
          *,
          gig:gigs(title),
          client:users!orders_client_id_fkey(username, email)
        `)
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw new Error(`Failed to create order: ${error.message}`);
      }

      console.log('Order created successfully:', JSON.stringify(order, null, 2));
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isValidAddress = (addr: string | undefined): boolean => {
    if (!addr) return false;
    try {
      new Address(addr); // Predpokladám, že Address je importovaný z MultiversX SDK
      return true;
    } catch {
      return false;
    }
  };

  return {
    mutateAsync,
    isLoading
  };
};