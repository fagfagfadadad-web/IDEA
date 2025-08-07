import { Transaction, TransactionManager, TransactionsDisplayInfoType, getAccountProvider } from 'lib';

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
    const txManager = TransactionManager.getInstance();
    console.log('🔄 signAndSendTransactions: Got transaction manager');

    console.log('🔄 signAndSendTransactions: Signing transactions...');
    const signedTransactions = await Promise.race([
      provider.signTransactions(transactions),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Transaction signing timeout')), timeout))
    ]);
    console.log('🔄 signAndSendTransactions: Transactions signed successfully:', signedTransactions);

    console.log('🔄 signAndSendTransactions: Sending transactions...');
    const sentTransactions = await txManager.send(signedTransactions as Transaction[]);
    console.log('🔄 signAndSendTransactions: Transactions sent:', sentTransactions);

    const transactionHashes = sentTransactions.map((tx: any) => tx.hash || tx.transactionHash);
    console.log('🔄 signAndSendTransactions: Transaction hashes:', transactionHashes);
    if (!transactionHashes || transactionHashes.length === 0) {
      throw new Error('Nepodarilo sa získať hash-y transakcií');
    }

    console.log('🔄 signAndSendTransactions: Tracking transactions...');
    await txManager.track(sentTransactions, { transactionsDisplayInfo });
    return transactionHashes[0]; // Vráti hash prvej transakcie
  } catch (error) {
    console.error('❌ signAndSendTransactions: Error occurred:', error);
    throw error;
  }
};