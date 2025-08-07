import { Transaction, TransactionManager, TransactionsDisplayInfoType, getAccountProvider } from 'lib';
import { UnlockPanelManager, useGetAccount } from 'lib';

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
             typeof p.signTransactions === 'function' && 
             typeof p.getAccount === 'function' &&
             typeof p.init === 'function';
    };

    // If provider is invalid, try to get a fresh one
    if (!isProviderValid(provider)) {
      console.log('🔧 signAndSendTransactions: Provider invalid, attempting to get fresh provider...');
      
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      provider = getAccountProvider();
      
      if (!isProviderValid(provider)) {
        console.log('🔧 signAndSendTransactions: Still invalid, trying provider init...');
        try {
          if (provider && typeof provider.init === 'function') {
            await provider.init();
            console.log('✅ signAndSendTransactions: Provider init successful');
          }
        } catch (initError) {
          console.log('⚠️ signAndSendTransactions: Provider init failed:', initError);
        }
        
        // Get provider again after init
        provider = getAccountProvider();
        
        if (!isProviderValid(provider)) {
          console.log('❌ signAndSendTransactions: Provider still invalid after init');
          throw new Error('Wallet connection lost. Please refresh the page and reconnect your wallet.');
        }
      }
    }
    
    console.log('🔄 signAndSendTransactions: Provider validation passed, checking account...');
    
    // Test provider functionality
    try {
      const account = await provider.getAccount();
      console.log('✅ signAndSendTransactions: Provider account check successful:', !!account?.address);
      
      if (!account || !account.address) {
        console.log('⚠️ signAndSendTransactions: No account found, but continuing...');
      }
    } catch (accountError) {
      console.log('⚠️ signAndSendTransactions: Account check failed, but continuing:', accountError);
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