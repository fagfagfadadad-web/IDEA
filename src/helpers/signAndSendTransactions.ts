import { Transaction, TransactionManager, TransactionsDisplayInfoType, getAccountProvider, UnlockPanelManager } from 'lib';

interface SignAndSendTransactionsProps {
  transactions: Transaction[];
  transactionsDisplayInfo?: TransactionsDisplayInfoType;
  timeout?: number;
}

export const signAndSendTransactions = async ({
  transactions,
  transactionsDisplayInfo,
  timeout = 120000
}: SignAndSendTransactionsProps) => {
  console.log('🔄 signAndSendTransactions: Starting with transactions:', transactions);
  
  try {
    let provider = getAccountProvider();
    console.log('🔄 signAndSendTransactions: Got provider:', provider);
    
    // Helper function to validate provider
    const isProviderValid = (p: any) => {
      return p && 
             p.provider && 
             typeof p.provider.signTransactions === 'function' && 
             typeof p.provider.getAccount === 'function';
    };

    // If provider is invalid, force user to reconnect instead of trying to fix it
    if (!isProviderValid(provider)) {
      console.log('❌ signAndSendTransactions: Provider is completely invalid, forcing reconnect');
      
      // Show user-friendly error that suggests reconnection
      throw new Error('Your wallet connection has expired. Please use the "Reconnect Wallet" button in the profile menu to restore the connection.');
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
        } else {
          throw new Error(`Transaction signing failed: ${signError.message}. If this persists, please use "Reconnect Wallet" in the profile menu.`);
        }
      }
      throw new Error('Transaction signing failed. Please try reconnecting your wallet.');
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