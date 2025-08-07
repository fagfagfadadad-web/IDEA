import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MoreVertical, Clock, DollarSign, CheckCircle, AlertTriangle, Paperclip, X, Smile } from 'lucide-react';
import { useMessages, useSendMessage } from '../hooks/useMessages';
import { useGetIsLoggedIn, useGetAccount } from 'lib';
import { useOrderById } from '../hooks/useOrders';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from 'components';

// Common emojis for quick access
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
  '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋',
  '🖖', '👏', '🙌', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵',
  '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟',
  '💯', '💥', '💫', '💦', '💨', '🔥', '⚡', '☀️', '🌙', '⭐',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✅', '❌', '⚠️', '🚫', '💯', '💢', '💬', '💭', '🗯️', '💤'
];

interface OrderChatProps {
  orderId: string;
}

export const OrderChat: React.FC<OrderChatProps> = ({ orderId }) => {
  const { data: messages, isLoading, refetch } = useMessages(orderId);
  const { data: order } = useOrderById(orderId);
  const isLoggedIn = useGetIsLoggedIn();
  const { user } = useAuth();
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Limit to 5 files total
    const totalFiles = [...attachedFiles, ...acceptedFiles];
    if (totalFiles.length > 5) {
      alert('You can only attach up to 5 files');
      // Take only the first 5 files
      setAttachedFiles(totalFiles.slice(0, 5));
      return;
    }
    setAttachedFiles(totalFiles);
  }, [attachedFiles]);

  const removeFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (attachedFiles.length === 0) return [];
    
    setIsUploading(true);
    const uploadedFiles = [];
    
    try {
      for (const file of attachedFiles) {
        // Mock file upload - replace with real implementation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        uploadedFiles.push({
          name: file.name,
          url: `https://example.com/files/${file.name}`,
          type: file.type,
          size: file.size,
        });
      }
      
      return uploadedFiles;
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again later.');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachedFiles.length === 0) return;

    if (!user) {
      alert('Please login to send messages');
      return;
    }

    try {
      // Upload files first if any
      const uploadedAttachments = await uploadFiles();
      
      await sendMessage.mutateAsync({
        orderId,
        content: newMessage.trim() || '(Attachments)',
        attachments: uploadedAttachments,
      });
      
      setNewMessage('');
      setAttachedFiles([]);
      
      // Refresh messages after sending
      if (refetch) {
        await refetch();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again later.');
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderMessage = (message: any, index: number) => {
    const isCurrentUser = message.sender?.id === user?.id;
    
    // Check if this is a system message
    const isSystemMessage = (() => {
      try {
        const content = JSON.parse(message.content);
        return content.type && content.type !== 'text';
      } catch {
        return false;
      }
    })();
    
    if (isSystemMessage) {
      try {
        const content = JSON.parse(message.content);
        
        // Order created system message
        if (content.type === 'order_created') {
          return (
            <div
              key={message.id || index}
              className="flex justify-center my-4"
            >
              <div className="bg-blue-800 text-white rounded-lg px-4 py-2 text-center max-w-[90%]">
                <p className="text-sm">🎉 New order created!</p>
              </div>
            </div>
          );
        }
        
        // Work delivered system message
        if (content.type === 'work_delivered') {
          return (
            <div
              key={message.id || index}
              className="flex justify-center my-4"
            >
              <div className="bg-green-800 text-white rounded-lg px-4 py-2 text-center max-w-[90%]">
                <p className="text-sm">{content.message}</p>
              </div>
            </div>
          );
        }
        
        // Dispute resolved system message
        if (content.type === 'dispute_resolved_admin') {
          return (
            <div
              key={message.id || index}
              className="flex justify-center my-4"
            >
              <div className="bg-purple-800 text-white rounded-lg px-4 py-2 text-center max-w-[90%]">
                <p className="text-sm">{content.message}</p>
              </div>
            </div>
          );
        }
        
        // Text message type
        if (content.type === 'text') {
          return (
            <div
              key={message.id || index}
              className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                isCurrentUser 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full overflow-hidden relative bg-gray-300">
                    {message.sender?.avatar_url ? (
                      <>
                        <img
                          src={message.sender.avatar_url}
                          alt={message.sender.username || "User"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }
                          }}
                        />
                        <div 
                          className="fallback-avatar w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-700 absolute inset-0"
                          style={{ display: 'none' }}
                        >
                          {message.sender?.username?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-700">
                        {message.sender?.username?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-sm">
                    {message.sender?.username}
                  </span>
                  <span className={`text-xs ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
                    {formatTimestamp(message.created_at)}
                  </span>
                </div>
                
                {/* Display the actual message content, not the JSON */}
                <p className={message.attachments?.length > 0 ? 'mb-2' : ''}>{content.message}</p>
                
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {message.attachments.map((attachment: any, i: number) => (
                      <a 
                        key={i}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center text-sm hover:underline ${
                          isCurrentUser ? 'text-white' : 'text-blue-600'
                        }`}
                      >
                        <Paperclip size={14} className="mr-1" />
                        {attachment.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        }
        
        // Default system message
        return (
          <div
            key={message.id || index}
            className="flex justify-center my-4"
          >
            <div className="bg-gray-700 text-white rounded-lg px-4 py-2 text-center max-w-[90%]">
              <p className="text-sm">{content.message || JSON.stringify(content)}</p>
            </div>
          </div>
        );
      } catch (error) {
        console.error('Error parsing system message:', error);
        return null;
      }
    }
    
    // Regular user message with possible attachments
    return (
      <div
        key={message.id || index}
        className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isCurrentUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-800'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
              {message.sender?.username?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <span className="font-medium text-sm">
              {message.sender?.username}
            </span>
            <span className={`text-xs ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
              {formatTimestamp(message.created_at)}
            </span>
          </div>
          
          {/* Message content */}
          {message.content && message.content !== '(Attachments)' && (
            <p className={message.attachments?.length > 0 ? 'mb-2' : ''}>{message.content}</p>
          )}
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-1 mt-1">
              {message.attachments.map((attachment: any, i: number) => (
                <a 
                  key={i}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center text-sm hover:underline ${
                    isCurrentUser ? 'text-white' : 'text-blue-600'
                  }`}
                >
                  <Paperclip size={14} className="mr-1" />
                  {attachment.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const groupMessagesByDate = () => {
    if (!messages) return [];
    
    const groups: { [key: string]: any[] } = {};
    
    messages.forEach(message => {
      const date = formatDate(message.created_at);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups);
  };

  return (
    <div className="space-y-4">
      {/* Chat Messages */}
      <div className="bg-gray-900 border border-gray-700 p-4 h-96 overflow-y-auto rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupMessagesByDate().map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-gray-600"></div>
                  <span className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-full text-xs text-gray-300 font-medium">{date}</span>
                  <div className="flex-1 border-t border-gray-600"></div>
                </div>
                {dateMessages.map((message, index) => renderMessage(message, index))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="bg-gray-800 border border-gray-600 p-3 rounded-lg">
          <div className="flex gap-2 flex-wrap">
            {attachedFiles.map((file, index) => (
              <div 
                key={index} 
                className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg flex items-center text-sm text-white"
              >
                <Paperclip size={14} className="mr-2 text-gray-300" />
                <span className="truncate max-w-32">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="ml-2 text-red-400 hover:text-red-300"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="space-y-3 w-full">
        {/* Input field - full width on mobile */}
        <div className="w-full">
          <div className="relative">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
              className="w-full p-3 pr-12 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
            
            {/* Emoji button inside input */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors"
            >
              <Smile size={20} />
            </button>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className="absolute bottom-full right-0 sm:right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 p-3 w-80 max-w-[calc(100vw-2rem)] left-1/2 transform -translate-x-1/2 sm:left-auto sm:transform-none">
                  <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto" style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-xl hover:bg-gray-700 rounded p-2 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Buttons row - stacked on mobile, side by side on desktop */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {/* File attachment button */}
          <button
            onClick={() => document.getElementById('file-input')?.click()}
            disabled={attachedFiles.length >= 5}
            className="flex items-center justify-center gap-2 px-4 py-3 text-gray-300 hover:text-blue-400 disabled:opacity-50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors w-full sm:flex-1 bg-gray-800 flex-shrink-0"
          >
            <Paperclip size={16} />
            <span className="text-sm">
              Attach Files ({attachedFiles.length}/5)
            </span>
          </button>
          
          {/* Send button */}
          <Button
            onClick={handleSendMessage}
            disabled={sendMessage.isLoading || isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium w-full sm:flex-1 flex-shrink-0"
          >
            <Send size={16} />
            {isUploading ? 'Uploading...' : 'Send'}
          </Button>
        </div>
        
        {/* Hidden file input */}
        <input
          id="file-input"
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            onDrop(files);
          }}
          className="hidden"
        />
      </div>
    </div>
  );
};