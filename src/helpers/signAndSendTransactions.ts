import { Transaction, TransactionManager, TransactionsDisplayInfoType, getAccountProvider, UnlockPanelManager, SignedTransactionType } from 'lib';

interface SignAndSendTransactionsProps {
  transactions: Transaction[];
  transactionsDisplayInfo?: TransactionsDisplayInfoType;
  timeout?: number;
  provider?: any;
}

export const signAndSendTransactions = async ({
  transactions,
  transactionsDisplayInfo,
  timeout = 120000,
  provider: providedProvider
}: SignAndSendTransactionsProps) => {
  console.log('🔄 signAndSendTransactions: Starting with transactions:', transactions);
  
  try {
    let provider = providedProvider || getAccountProvider();
    console.log('🔄 signAndSendTransactions: Got provider:', provider);
    
    // Helper function to validate provider
    const isProviderValid = (p: any) => {
      return p && 
             typeof p.signTransactions === 'function';
    };

    // Check if provider is WalletConnect and handle session
    if (provider && typeof provider.isConnected === 'function') {
      try {
        const isConnected = await provider.isConnected();
        if (!isConnected) {
          console.log('🔄 WalletConnect session expired, attempting to reconnect...');
          if (typeof provider.reconnect === 'function') {
            await provider.reconnect();
            console.log('✅ WalletConnect session restored');
          } else {
            throw new Error('WALLET_PROVIDER_DISCONNECTED');
          }
        } else {
          console.log('✅ WalletConnect session is active');
        }
      } catch (sessionError) {
        console.error('❌ WalletConnect session error:', sessionError);
        throw new Error('WALLET_PROVIDER_DISCONNECTED');
      }
    }
    // If provider is invalid, try to reinitialize it
    if (!isProviderValid(provider)) {
      console.log('🔧 signAndSendTransactions: Provider invalid, attempting to get fresh provider...');
      try {
        // Attempt to reinitialize UnlockPanelManager which should restore provider state
        const unlockPanelManager = UnlockPanelManager.init({
          loginHandler: () => {
            console.log('🔧 signAndSendTransactions: Provider reinitialized via login handler');
          },
          onClose: () => {
            throw new Error('Transaction signing failed: User closed the panel'); // Opravené: Všeobecná chyba
          }
        });
        // Don't actually open the panel, just initialize the manager
        await unlockPanelManager.init();
        console.log('✅ signAndSendTransactions: UnlockPanelManager reinitialized');
        
        // Get the fresh provider instance
        provider = getAccountProvider();
        if (!isProviderValid(provider)) {
          console.log('❌ signAndSendTransactions: Provider still invalid after reinitialization attempt.');
          throw new Error('WALLET_PROVIDER_DISCONNECTED');
        }
        console.log('✅ signAndSendTransactions: Provider successfully reinitialized.');
      } catch (reinitError) {
        console.error('❌ signAndSendTransactions: Provider reinitialization failed:', reinitError);
        throw new Error('WALLET_PROVIDER_DISCONNECTED');
      }
    }
    
    console.log('✅ signAndSendTransactions: Provider validation passed');
    
    const txManager = TransactionManager.getInstance();
    console.log('🔄 signAndSendTransactions: Got transaction manager');

    console.log('🔄 signAndSendTransactions: Signing transactions...');
    
    let signedTransactions;
    try {
      signedTransactions = await Promise.race([
        provider.signTransactions(transactions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction signing timeout - please try again')), 60000)
        )
      ]);
    } catch (signError) {
      console.error('🔄 signAndSendTransactions: Signing failed:', signError);
      
      if (signError instanceof Error) {
        if (signError.message.includes('timeout')) {
          throw new Error('Transaction signing timed out. Please try again.');
        } else if (signError.message.includes('User rejected') || signError.message.includes('cancelled')) {
          throw signError; // Re-throw user rejection errors as-is
        } else if (signError.message.includes('Unable to sign transactions')) {
          // Specific error for provider not being able to sign
          throw new Error('WALLET_PROVIDER_DISCONNECTED');
        } else {
          throw new Error(`Transaction signing failed: ${signError.message}`);
        }
      }
      throw new Error('Transaction signing failed. Unknown error.');
    }
    
    console.log('🔄 signAndSendTransactions: Transactions signed successfully:', signedTransactions);

    console.log('🔄 signAndSendTransactions: Sending transactions...');
    let sentTransactions;
    try {
      sentTransactions = await Promise.race([
        txManager.send(signedTransactions as Transaction[]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction sending timeout - network may be congested')), timeout)
        )
      ]);
    } catch (sendError) {
      console.error('🔄 signAndSendTransactions: Sending failed:', sendError);
      throw new Error(`Transaction sending failed: ${sendError instanceof Error ? sendError.message : 'Unknown error'}`);
    }
    
    console.log('🔄 signAndSendTransactions: Transactions sent:', sentTransactions);

    const transactionHashes = sentTransactions.map((tx: any) => tx.hash || tx.transactionHash);
    console.log('🔄 signAndSendTransactions: Transaction hashes:', transactionHashes);
    if (!transactionHashes || transactionHashes.length === 0) {
      throw new Error('Failed to get transaction hashes from sent transactions');
    }

    console.log('🔄 signAndSendTransactions: Tracking transactions...');
    try {
      await txManager.track(sentTransactions, { transactionsDisplayInfo });
    } catch (trackError) {
      console.error('🔄 signAndSendTransactions: Tracking failed:', trackError);
      // Don't fail the whole process if tracking fails, just log it
      console.log('🔄 signAndSendTransactions: Continuing despite tracking error');
    }
    
    return transactionHashes[0]; // Return hash of first transaction
  } catch (error) {
    console.error('❌ signAndSendTransactions: Error occurred:', error);
    throw error;
  }
};