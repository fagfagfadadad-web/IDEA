import {
  getAccountProvider,
  Transaction,
  TransactionManager,
  TransactionsDisplayInfoType
} from 'lib';

type SignAndSendTransactionsProps = {
  transactions: Transaction[];
  transactionsDisplayInfo?: TransactionsDisplayInfoType;
};

export const signAndSendTransactions = async ({
  transactions,
  transactionsDisplayInfo
}: SignAndSendTransactionsProps) => {
  console.log('🔄 signAndSendTransactions: Starting with transactions:', transactions);
  
  try {
    const provider = getAccountProvider();
    console.log('🔄 signAndSendTransactions: Got provider:', provider);
    console.log('🔄 signAndSendTransactions: Provider type:', provider.getType());
    console.log('🔄 signAndSendTransactions: Provider type check completed');
  
    const txManager = TransactionManager.getInstance();
    console.log('🔄 signAndSendTransactions: Got transaction manager');

    console.log('🔄 signAndSendTransactions: Signing transactions...');
    console.log('🔄 signAndSendTransactions: About to call provider.signTransactions with:', transactions);
    
    // Add timeout to prevent hanging
    const signPromise = provider.signTransactions(transactions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Transaction signing timeout after 60 seconds')), 60000)
    );
    
    const signedTransactions = await Promise.race([signPromise, timeoutPromise]);
    console.log('🔄 signAndSendTransactions: Transactions signed successfully:', signedTransactions);
  
    console.log('🔄 signAndSendTransactions: Sending transactions...');
    const sentTransactions = await txManager.send(signedTransactions as Transaction[]);
    console.log('🔄 signAndSendTransactions: Transactions sent:', sentTransactions);
  
    console.log('🔄 signAndSendTransactions: Tracking transactions...');
    const sessionId = await txManager.track(sentTransactions, {
      transactionsDisplayInfo
    });
    console.log('🔄 signAndSendTransactions: Session ID:', sessionId);

    return sessionId;
  } catch (error) {
    console.error('❌ signAndSendTransactions: Error occurred:', error);
    console.error('❌ signAndSendTransactions: Error type:', typeof error);
    console.error('❌ signAndSendTransactions: Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ signAndSendTransactions: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
};
