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
  increment,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ChatMessage {
  id?: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  message: string;
  messageType: 'text' | 'food_transfer' | 'ticket_transfer';
  foodAmount?: number;
  ticketAmount?: number;
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

  static async sendTicketTransfer(
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
      gameTickets: increment(-amount)
    });

    // Add to recipient
    batch.update(recipientStatsRef, {
      gameTickets: increment(amount)
    });

    // Create chat message
    const messageRef = doc(collection(db, 'chatMessages'));
    batch.set(messageRef, {
      userId: senderId,
      username: senderUsername,
      avatarUrl: senderAvatarUrl || '🐕',
      message: `sent ${amount} 🎫 Tickets`,
      messageType: 'ticket_transfer',
      ticketAmount: amount,
      recipientId,
      recipientUsername,
      createdAt: serverTimestamp()
    });

    await batch.commit();
    console.log('🎫 ChatService: Ticket transfer completed:', amount, 'from', senderUsername, 'to', recipientUsername);
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

  static async deleteMessage(messageId: string): Promise<void> {
    const messageRef = doc(db, 'chatMessages', messageId);
    await deleteDoc(messageRef);
    console.log('🗑️ ChatService: Message deleted:', messageId);
  }

  static async clearAllMessages(): Promise<void> {
    const q = query(collection(db, 'chatMessages'));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('🗑️ ChatService: All messages cleared');
  }

  static async banUserFromChat(userId: string, durationMinutes: number = 60): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const banUntil = new Date();
    banUntil.setMinutes(banUntil.getMinutes() + durationMinutes);

    await updateDoc(userRef, {
      chatBanUntil: banUntil,
      isChatBanned: true
    });

    console.log('🚫 ChatService: User banned from chat until:', banUntil);
  }

  static async unbanUserFromChat(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      chatBanUntil: null,
      isChatBanned: false
    });

    console.log('✅ ChatService: User unbanned from chat');
  }
}
