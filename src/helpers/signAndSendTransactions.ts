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
    if (provider && 'isConnected' in provider && typeof (provider as any).isConnected === 'function') {
      try {
        const isConnected = await (provider as any).isConnected();
        if (!isConnected) {
          console.log('🔄 WalletConnect session expired, attempting to reconnect...');
          if ('reconnect' in provider && typeof (provider as any).reconnect === 'function') {
            await (provider as any).reconnect();
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
      // Type-safe handling of transaction sending
      const sendResult = await Promise.race([
        txManager.send(signedTransactions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction sending timeout - network may be congested')), timeout)
        )
      ]);
      sentTransactions = sendResult;
    } catch (sendError) {
      console.error('🔄 signAndSendTransactions: Sending failed:', sendError);
      
      // Better error handling for common transaction errors
      if (sendError instanceof Error) {
        if (sendError.message.includes('ed25519: invalid signature')) {
          throw new Error('Transaction signing failed. Please try reconnecting your wallet and ensure it is properly unlocked.');
        } else if (sendError.message.includes('nonce')) {
          throw new Error('Transaction nonce error. Please refresh the page and try again.');
        } else if (sendError.message.includes('insufficient funds')) {
          throw new Error('Insufficient funds for transaction fees.');
        } else {
          throw new Error(`Transaction sending failed: ${sendError.message}`);
        }
      }
      throw new Error('Transaction sending failed: Unknown error');
    }
    
    console.log('🔄 signAndSendTransactions: Transactions sent:', sentTransactions);

    // Type-safe handling of transaction hashes
    let transactionHashes: string[] = [];
    
    try {
      if (Array.isArray(sentTransactions)) {
        transactionHashes = (sentTransactions as any[]).map((tx: any) => tx.hash || tx.transactionHash || tx.txHash);
      } else if (sentTransactions && typeof sentTransactions === 'object') {
        const singleTx = sentTransactions as any;
        transactionHashes = [singleTx.hash || singleTx.transactionHash || singleTx.txHash];
      }
    } catch (hashError) {
      console.error('🔄 signAndSendTransactions: Error extracting transaction hashes:', hashError);
      throw new Error('Failed to extract transaction hashes from sent transactions');
    }
    
    console.log('🔄 signAndSendTransactions: Transaction hashes:', transactionHashes);
    if (!transactionHashes || transactionHashes.length === 0 || !transactionHashes[0]) {
      throw new Error('Failed to get valid transaction hashes from sent transactions');
    }
    } else {
      transactionHashes = [(sentTransactions as any).hash || (sentTransactions as any).transactionHash];
    }
    
    console.log('🔄 signAndSendTransactions: Transaction hashes:', transactionHashes);
    if (!transactionHashes || transactionHashes.length === 0) {
      throw new Error('Failed to get transaction hashes from sent transactions');
    }

    console.log('🔄 signAndSendTransactions: Tracking transactions...');
    try {
      // Type-safe tracking with proper casting
      await txManager.track(sentTransactions as any, { transactionsDisplayInfo });
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
    console.log('🔄 signAndSendTransactions: Tracking transactions...');
    try {
      await txManager.track(sentTransactions as any, { transactionsDisplayInfo });
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