import { 
  TransactionManager, 
  getAccountProvider,
  TransactionsDisplayInfoType 
} from 'lib';
import { Transaction } from '@multiversx/sdk-core';

export const signAndSendTransactions = async (
  transactions: Transaction[],
  transactionsDisplayInfo?: TransactionsDisplayInfoType
) => {
  try {
    const provider = getAccountProvider();
    const signedTransactions = await provider.signTransactions(transactions);
    
    const txManager = TransactionManager.getInstance();
    const sentTransactions = await txManager.send(signedTransactions);
    const sessionId = await txManager.track(sentTransactions, {
      transactionsDisplayInfo
    });
    
    return { sessionId, sentTransactions };
  } catch (error) {
    console.error('Error signing and sending transactions:', error);
    throw error;
  }
};