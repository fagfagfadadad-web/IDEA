import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Gift } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { ChatService, ChatMessage } from '../../services/chatService';
import { Button } from '../Button';

export const Chat = () => {
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSendFood, setShowSendFood] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; username: string } | null>(null);
  const [foodAmount, setFoodAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = ChatService.subscribeToMessages((msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!user?.id || !newMessage.trim()) return;

    try {
      setIsSending(true);
      await ChatService.sendMessage(
        user.id,
        user.username || 'Anonymous',
        newMessage.trim(),
        user.avatarUrl
      );
      setNewMessage('');
    } catch (err: any) {
      error(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendFood = async () => {
    if (!user?.id || !selectedRecipient || !foodAmount) return;

    const amount = parseInt(foodAmount);
    if (isNaN(amount) || amount <= 0) {
      error('Please enter a valid amount');
      return;
    }

    if (amount > (gameStats?.zenBalance || 0)) {
      error('Insufficient Food balance');
      return;
    }

    try {
      setIsSending(true);
      await ChatService.sendFoodTransfer(
        user.id,
        user.username || 'Anonymous',
        selectedRecipient.id,
        selectedRecipient.username,
        amount,
        user.avatarUrl
      );
      success(`Sent ${amount} 🍖 Food to ${selectedRecipient.username}!`);
      setShowSendFood(false);
      setSelectedRecipient(null);
      setFoodAmount('');
      await refetch();
    } catch (err: any) {
      error(err.message || 'Failed to send Food');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 w-96 h-[600px] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden border-2 border-primary-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <h3 className="font-bold">Community Chat</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 rounded-full p-1 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.userId === user?.id;
            const isFoodTransfer = msg.messageType === 'food_transfer';
            const isRecipient = msg.recipientId === user?.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-200 flex items-center justify-center text-lg">
                  {msg.avatarUrl}
                </div>
                <div className={`flex-1 ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 max-w-xs ${
                      isFoodTransfer
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border border-orange-200'
                        : isOwnMessage
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    {isFoodTransfer ? (
                      <div className="flex items-center gap-2">
                        <Gift size={16} className="text-orange-600" />
                        <span className={isRecipient ? 'font-bold text-green-600' : 'text-gray-700'}>
                          {msg.message}
                          {msg.recipientUsername && ` to ${msg.recipientUsername}`}
                          {isRecipient && ' (You received!)'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm break-words">{msg.message}</p>
                    )}
                  </div>
                  {!isOwnMessage && !isFoodTransfer && (
                    <button
                      onClick={() => {
                        setSelectedRecipient({ id: msg.userId, username: msg.username });
                        setShowSendFood(true);
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                    >
                      Send Food 🍖
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Send Food Modal */}
      {showSendFood && selectedRecipient && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-gray-800">Send Food to {selectedRecipient.username}</h4>
              <button onClick={() => setShowSendFood(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Amount (🍖 Food)</label>
              <input
                type="number"
                value={foodAmount}
                onChange={(e) => setFoodAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                max={gameStats?.zenBalance || 0}
              />
              <p className="text-xs text-gray-600">
                Your balance: {gameStats?.zenBalance?.toLocaleString() || 0} 🍖
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowSendFood(false)}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendFood}
                disabled={isSending || !foodAmount}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white"
              >
                <Gift size={16} />
                Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={!user?.id || isSending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!user?.id || !newMessage.trim() || isSending}
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};
