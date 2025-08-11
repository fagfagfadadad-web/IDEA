import { supabase } from '../lib/supabase';
import { TransactionHistory } from '../types/rewards.types';

export class TransactionService {
  // Record a transaction
  static async recordTransaction(
    userAddress: string,
    transactionData: Omit<TransactionHistory, 'id' | 'timestamp'>
  ): Promise<TransactionHistory | null> {
    try {
      const { data, error } = await supabase
        .from('transaction_history')
        .insert({
          ...transactionData,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error recording transaction:', error);
      return null;
    }
  }

  // Get transaction history for user
  static async getTransactionHistory(
    address: string, 
    limit: number = 20
  ): Promise<TransactionHistory[]> {
    try {
      const { data, error } = await supabase
        .from('transaction_history')
        .select('*')
        .or(`from_address.eq.${address},to_address.eq.${address}`)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  // Update transaction status
  static async updateTransactionStatus(
    transactionHash: string, 
    status: 'pending' | 'success' | 'failed'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('transaction_history')
        .update({ status })
        .eq('transaction_hash', transactionHash);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating transaction status:', error);
    }
  }

  // Sync transactions from MultiversX API (for IDA tokens)
  static async syncTransactionsFromAPI(address: string): Promise<void> {
    try {
      // This would sync IDA token transactions from MultiversX API
      // For now, we'll just log that sync was attempted
      console.log('Syncing IDA transactions for address:', address);
      
      // In a real implementation, you would:
      // 1. Fetch transactions from MultiversX API
      // 2. Filter for IDA token transactions
      // 3. Store new transactions in the database
      // 4. Update user balances if needed
    } catch (error) {
      console.error('Error syncing transactions:', error);
    }
  }
}