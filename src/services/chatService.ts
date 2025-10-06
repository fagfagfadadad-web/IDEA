import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
  writeBatch,
  doc,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ChatMessage {
  id?: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  message: string;
  messageType: 'text' | 'food_transfer';
  foodAmount?: number;
  recipientId?: string;
  recipientUsername?: string;
  createdAt: any;
}

export class ChatService {
  static async sendMessage(
    userId: string,
    username: string,
    message: string,
    avatarUrl?: string
  ): Promise<string> {
    const messageData = {
      userId,
      username,
      avatarUrl: avatarUrl || '🐕',
      message,
      messageType: 'text' as const,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'chatMessages'), messageData);
    console.log('💬 ChatService: Message sent with ID:', docRef.id);
    return docRef.id;
  }

  static async sendFoodTransfer(
    senderId: string,
    senderUsername: string,
    recipientId: string,
    recipientUsername: string,
    amount: number,
    senderAvatarUrl?: string
  ): Promise<void> {
    const batch = writeBatch(db);

    // Check sender balance
    const senderStatsRef = doc(db, 'gameStats', senderId);
    const recipientStatsRef = doc(db, 'gameStats', recipientId);

    // Deduct from sender
    batch.update(senderStatsRef, {
      zenBalance: increment(-amount)
    });

    // Add to recipient
    batch.update(recipientStatsRef, {
      zenBalance: increment(amount)
    });

    // Create chat message
    const messageRef = doc(collection(db, 'chatMessages'));
    batch.set(messageRef, {
      userId: senderId,
      username: senderUsername,
      avatarUrl: senderAvatarUrl || '🐕',
      message: `sent ${amount} 🍖 Food`,
      messageType: 'food_transfer',
      foodAmount: amount,
      recipientId,
      recipientUsername,
      createdAt: serverTimestamp()
    });

    await batch.commit();
    console.log('💸 ChatService: Food transfer completed:', amount, 'from', senderUsername, 'to', recipientUsername);
  }

  static subscribeToMessages(
    callback: (messages: ChatMessage[]) => void,
    limitCount = 50
  ): () => void {
    const q = query(
      collection(db, 'chatMessages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];

      // Reverse to show oldest first
      callback(messages.reverse());
    });

    return unsubscribe;
  }

  static async getRecentMessages(limitCount = 50): Promise<ChatMessage[]> {
    const q = query(
      collection(db, 'chatMessages'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];

    return messages.reverse();
  }
}
