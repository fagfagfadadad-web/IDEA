import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface User {
  id?: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  email?: string;
  walletAddress?: string;
  isAdmin?: boolean;
  isBanned?: boolean;
  isChatBanned?: boolean;
  chatBanUntil?: Date | null;
  emailNotificationsEnabled?: boolean;
  twitterUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  discordUsername?: string;
  telegramUsername?: string;
  isProfileReady?: boolean;
  createdAt: any;
  updatedAt?: any;
}

export class UserService {
  static async getUser(userId: string): Promise<User | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  }

  static async createUser(userId: string, userData: Partial<User>): Promise<User> {
    const user: Omit<User, 'id'> = {
      username: userData.username || `user_${userId.substring(0, 8)}`,
      fullName: userData.fullName || '',
      avatarUrl: userData.avatarUrl || '',
      bio: userData.bio || '',
      email: userData.email || '',
      walletAddress: userData.walletAddress || '',
      isAdmin: false,
      isBanned: false,
      isChatBanned: false,
      chatBanUntil: null,
      emailNotificationsEnabled: false,
      twitterUrl: '',
      githubUrl: '',
      linkedinUrl: '',
      websiteUrl: '',
      discordUsername: '',
      telegramUsername: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, user);

    return { id: userId, ...user } as User;
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const docRef = doc(db, 'users', userId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    console.log('🔄 UserService: Updating user with data:', updateData);
    await updateDoc(docRef, updateData);
    console.log('✅ UserService: User updated successfully');
  }

  static async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    const q = query(
      collection(db, 'users'),
      where('walletAddress', '==', walletAddress),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as User;
    }
    return null;
  }

  static async getAllUsers(limitCount = 100): Promise<User[]> {
    const q = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];
  }

  static async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const q = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return true;
    
    // If excluding a user ID, check if the only match is that user
    if (excludeUserId) {
      return querySnapshot.docs.length === 1 && querySnapshot.docs[0].id === excludeUserId;
    }
    
    return false;
  }

  static async generateUniqueUsername(baseUsername: string): Promise<string> {
    let username = baseUsername;
    let counter = 1;

    while (!(await this.isUsernameAvailable(username))) {
      username = `${baseUsername}${counter}`;
      counter++;
      if (counter > 100) break;
    }

    return username;
  }

  static async getUsersWithWallets(): Promise<Array<{ username: string; walletAddress: string; userId: string }>> {
    const q = query(
      collection(db, 'users'),
      where('walletAddress', '!=', '')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({
        userId: doc.id,
        username: doc.data().username || 'Unknown',
        walletAddress: doc.data().walletAddress || ''
      }))
      .filter(user => user.walletAddress);
  }
}