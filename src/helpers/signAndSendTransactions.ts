import { Transaction, TransactionManager, TransactionsDisplayInfoType, getAccountProvider } from 'lib';
import { UnlockPanelManager } from 'lib';

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
    const provider = getAccountProvider();
    console.log('🔄 signAndSendTransactions: Got provider:', provider);
    
    // Check if provider is in a valid state
    if (!provider || typeof provider.signTransactions !== 'function' || typeof provider.getAccount !== 'function') {
      throw new Error('Wallet provider is not properly initialized. Please reconnect your wallet.');
    }
    
    // Additional check for provider state - try to get account to verify connection
    try {
      const account = await provider.getAccount();
      console.log('🔄 signAndSendTransactions: Provider account check:', !!account);
      
      if (!account || !account.address) {
        console.log('🔄 signAndSendTransactions: Provider account invalid, attempting reinitialization...');
        
        // Try to reinitialize the provider
        try {
          await provider.init();
          const recheckAccount = await provider.getAccount();
          if (!recheckAccount || !recheckAccount.address) {
            throw new Error('Provider reinitialization failed');
          }
          console.log('🔄 signAndSendTransactions: Provider successfully reinitialized');
        } catch (reinitError) {
          console.error('🔄 signAndSendTransactions: Provider reinitialization failed:', reinitError);
          throw new Error('Wallet connection lost. Please reconnect your wallet and try again.');
        }
      }
    } catch (accountError) {
      console.error('🔄 signAndSendTransactions: Provider account check failed:', accountError);
      throw new Error('Wallet connection unstable. Please reconnect your wallet and try again.');
    }
    
    const txManager = TransactionManager.getInstance();
    console.log('🔄 signAndSendTransactions: Got transaction manager');

    console.log('🔄 signAndSendTransactions: Signing transactions...');
    
    let signedTransactions;
    try {
      signedTransactions = await Promise.race([
        provider.signTransactions(transactions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Transaction signing timeout after 60 seconds - please reconnect your wallet and try again')), 60000)
        )
      ]);
    } catch (signError) {
      console.error('🔄 signAndSendTransactions: Signing failed:', signError);
      
      // If signing fails, it might be due to wallet state issues
      if (signError instanceof Error) {
        if (signError.message.includes('timeout')) {
          throw new Error('Transaction signing timed out. Your wallet may have lost connection. Please reconnect your wallet and try again.');
        } else if (signError.message.includes('User rejected') || signError.message.includes('cancelled')) {
          throw signError; // Re-throw timeout and user rejection errors as-is
        } else {
          throw new Error(`Transaction signing failed: ${signError.message}. Try reconnecting your wallet.`);
        }
      }
      throw new Error('Transaction signing failed. Please reconnect your wallet and try again.');
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