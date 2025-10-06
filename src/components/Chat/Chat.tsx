import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Gift, Smile, Image as ImageIcon, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useToast } from '../../context/ToastContext';
import { ChatService, ChatMessage } from '../../services/chatService';
import { Button } from '../Button';

const EMOJI_LIST = ['😀', '😂', '🤣', '😍', '🥰', '😎', '🤔', '😮', '😢', '😭', '😡', '🤯', '🥳', '🤩', '😇', '🤗', '🙌', '👍', '👎', '❤️', '💕', '🔥', '✨', '⭐', '🎉', '🎊', '🎁', '🎈', '🌟', '💯', '🚀', '🐶', '🐕', '🍖', '💰', '💎'];

const TRENDING_GIFS = [
  'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
  'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif',
  'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif',
  'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
  'https://media.giphy.com/media/3o6Mb6PM6iLiMdlIre/giphy.gif',
  'https://media.giphy.com/media/l0HlPystfePnAI3G8/giphy.gif',
  'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif'
];

const GIPHY_API_KEY = 'TaWKi4rH5zEd99WO7ZP6HMxIeiPh63bp';

interface GiphyGif {
  id: string;
  images: {
    fixed_height_small: {
      url: string;
    };
  };
}

export const Chat = () => {
  const { user } = useAuth();
  const { gameStats, refetch } = useGame();
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSendFood, setShowSendFood] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ id: string; username: string } | null>(null);
  const [foodAmount, setFoodAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [searchedGifs, setSearchedGifs] = useState<GiphyGif[]>([]);
  const [isSearchingGifs, setIsSearchingGifs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (!gifSearchQuery.trim()) {
      setSearchedGifs([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchGifs(gifSearchQuery);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [gifSearchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) return;

    setIsSearchingGifs(true);
    try {
      const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g`;
      console.log('Searching GIFs with URL:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('GIF search results:', data);

      if (data.data && Array.isArray(data.data)) {
        setSearchedGifs(data.data);
      } else {
        console.warn('Unexpected API response format:', data);
        setSearchedGifs([]);
      }
    } catch (err) {
      console.error('Failed to search GIFs:', err);
      error('Failed to search GIFs. Please try again.');
      setSearchedGifs([]);
    } finally {
      setIsSearchingGifs(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleGifClick = async (gifUrl: string) => {
    if (!user?.id) return;

    try {
      setIsSending(true);
      await ChatService.sendMessage(
        user.id,
        user.username || 'Anonymous',
        gifUrl,
        user.avatarUrl
      );
      setShowGifPicker(false);
      setGifSearchQuery('');
      setSearchedGifs([]);
    } catch (err: any) {
      error(err.message || 'Failed to send GIF');
    } finally {
      setIsSending(false);
    }
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
      setShowEmojiPicker(false);
      setShowGifPicker(false);
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
        className="fixed bottom-[88px] md:bottom-6 right-4 md:left-6 md:right-auto z-[1000000] bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="md:hidden fixed inset-0 bg-black/50 z-[1000001] animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Chat Window */}
      <div className="fixed bottom-0 left-0 right-0 md:inset-auto md:bottom-6 md:left-6 z-[1000002] md:w-96 h-[90vh] max-h-[700px] md:h-[600px] bg-white md:rounded-xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-primary-200 animate-slide-up">
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
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle size={40} className="mx-auto mb-2 opacity-50 md:w-12 md:h-12" />
            <p className="text-sm md:text-base">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.userId === user?.id;
            const isFoodTransfer = msg.messageType === 'food_transfer';
            const isRecipient = msg.recipientId === user?.id;
            const isGif = msg.message.match(/^https?:\/\/.+\.(gif|giphy\.com)/i);

            return (
              <div
                key={msg.id}
                className={`flex gap-1.5 md:gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary-200 flex items-center justify-center text-base md:text-lg">
                  {msg.avatarUrl}
                </div>
                <div className={`flex-1 max-w-[75%] md:max-w-xs ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {msg.username}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 ${
                      isFoodTransfer
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border border-orange-200'
                        : isOwnMessage
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-gray-200'
                    } ${isGif ? 'p-0' : ''}`}
                  >
                    {isFoodTransfer ? (
                      <div className="flex items-center gap-1.5">
                        <Gift size={14} className="text-orange-600 flex-shrink-0 md:w-4 md:h-4" />
                        <span className={`text-xs md:text-sm ${isRecipient ? 'font-bold text-green-600' : 'text-gray-700'}`}>
                          {msg.message}
                          {msg.recipientUsername && ` to ${msg.recipientUsername}`}
                          {isRecipient && ' (You!)'}
                        </span>
                      </div>
                    ) : isGif ? (
                      <img
                        src={msg.message}
                        alt="GIF"
                        className="max-w-full rounded-lg"
                        style={{ maxHeight: '150px' }}
                      />
                    ) : (
                      <p className="text-xs md:text-sm break-words">{msg.message}</p>
                    )}
                  </div>
                  {!isOwnMessage && !isFoodTransfer && (
                    <button
                      onClick={() => {
                        setSelectedRecipient({ id: msg.userId, username: msg.username });
                        setShowSendFood(true);
                      }}
                      className="text-xs text-primary-600 hover:text-primary-700 active:text-primary-800 mt-0.5 md:mt-1"
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
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-3 md:p-4 z-10">
          <div className="bg-white rounded-xl p-4 md:p-6 max-w-sm w-full space-y-3 md:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-sm md:text-base text-gray-800 truncate">Send Food to {selectedRecipient.username}</h4>
              <button onClick={() => setShowSendFood(false)} className="text-gray-500 hover:text-gray-700 flex-shrink-0 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs md:text-sm font-medium text-gray-700">Amount (🍖 Food)</label>
              <input
                type="number"
                value={foodAmount}
                onChange={(e) => setFoodAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                max={gameStats?.zenBalance || 0}
              />
              <p className="text-xs text-gray-600">
                Your balance: {gameStats?.zenBalance?.toLocaleString() || 0} 🍖
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSendFood(false)}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendFood}
                disabled={isSending || !foodAmount}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <Gift size={16} />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-2 right-2 md:bottom-20 md:left-4 md:right-auto bg-white rounded-lg shadow-xl p-3 md:p-4 border-2 border-primary-200 z-20 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-700">Pick an Emoji</h4>
            <button onClick={() => setShowEmojiPicker(false)} className="text-gray-500 hover:text-gray-700 p-1">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-6 md:grid-cols-7 gap-1.5 md:gap-2 max-h-40 md:max-h-48 overflow-y-auto">
            {EMOJI_LIST.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleEmojiClick(emoji)}
                className="text-xl md:text-2xl hover:scale-110 active:scale-95 transition-transform p-1.5 md:p-2 hover:bg-gray-100 rounded"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GIF Picker */}
      {showGifPicker && (
        <div className="absolute bottom-16 left-2 right-2 md:bottom-20 md:left-4 md:right-auto bg-white rounded-lg shadow-xl p-3 md:p-4 border-2 border-primary-200 z-20 md:w-80">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-700">
              {gifSearchQuery ? 'Search Results' : 'Trending GIFs'}
            </h4>
            <button
              onClick={() => {
                setShowGifPicker(false);
                setGifSearchQuery('');
                setSearchedGifs([]);
              }}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-3">
            <div className="relative mb-2">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={gifSearchQuery}
                onChange={(e) => setGifSearchQuery(e.target.value)}
                placeholder="Search GIFs (e.g., 'dog', 'happy')..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {searchedGifs.length > 0 && (
              <p className="text-xs text-gray-500 px-1">
                Found {searchedGifs.length} GIF{searchedGifs.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* GIF Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-52 md:max-h-64 overflow-y-auto">
            {isSearchingGifs ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                <p className="text-sm">Searching for "{gifSearchQuery}"...</p>
              </div>
            ) : searchedGifs.length > 0 ? (
              searchedGifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleGifClick(gif.images.fixed_height_small.url)}
                  className="relative overflow-hidden rounded-lg hover:opacity-80 active:opacity-60 transition-opacity"
                  disabled={isSending}
                >
                  <img
                    src={gif.images.fixed_height_small.url}
                    alt="GIF"
                    className="w-full h-20 md:h-24 object-cover"
                  />
                </button>
              ))
            ) : gifSearchQuery ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                <p className="text-sm mb-2">No GIFs found for "{gifSearchQuery}"</p>
                <p className="text-xs text-gray-400">Try a different search term</p>
              </div>
            ) : (
              TRENDING_GIFS.map((gifUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGifClick(gifUrl)}
                  className="relative overflow-hidden rounded-lg hover:opacity-80 active:opacity-60 transition-opacity"
                  disabled={isSending}
                >
                  <img src={gifUrl} alt={`GIF ${idx + 1}`} className="w-full h-20 md:h-24 object-cover" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-2 md:p-4 bg-white border-t border-gray-200">
        <div className="flex gap-1 md:gap-2 items-center">
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowGifPicker(false);
            }}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            disabled={!user?.id || isSending}
            title="Add emoji"
          >
            <Smile size={18} className="text-gray-600 md:w-5 md:h-5" />
          </button>
          <button
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowEmojiPicker(false);
            }}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            disabled={!user?.id || isSending}
            title="Add GIF"
          >
            <ImageIcon size={18} className="text-gray-600 md:w-5 md:h-5" />
          </button>
          <button
            onClick={() => {
              // Find the latest message from someone else to send food to
              const otherUsersMessages = messages.filter(m => m.userId !== user?.id && m.messageType !== 'food_transfer');
              if (otherUsersMessages.length > 0) {
                const latestMsg = otherUsersMessages[otherUsersMessages.length - 1];
                setSelectedRecipient({ id: latestMsg.userId, username: latestMsg.username });
                setShowSendFood(true);
              }
            }}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            disabled={!user?.id || isSending || messages.filter(m => m.userId !== user?.id && m.messageType !== 'food_transfer').length === 0}
            title="Send Food"
          >
            <Gift size={18} className="text-gray-600 md:w-5 md:h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0"
            disabled={!user?.id || isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={!user?.id || !newMessage.trim() || isSending}
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:from-primary-600 hover:to-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
            title="Send message"
          >
            <Send size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
