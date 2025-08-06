import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { useSendProposalMessage } from '../hooks/useProposals';
import { useGetIsLoggedIn } from 'lib';
import { Button, Card } from 'components';

interface ProposalChatProps {
  proposalId: string;
  messages: any[];
  isLoading: boolean;
}

export const ProposalChat: React.FC<ProposalChatProps> = ({
  proposalId,
  messages,
  isLoading,
}) => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoggedIn = useGetIsLoggedIn();
  const sendMessage = useSendProposalMessage();

  // Mock user - replace with real auth context
  const user = isLoggedIn ? { id: 'user1', username: 'testuser' } : null;

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
    if (!message.trim() && attachedFiles.length === 0) return;

    try {
      // Upload files first if any
      const uploadedAttachments = await uploadFiles();
      
      await sendMessage.mutateAsync({
        proposalId,
        content: message.trim() || '(Attachments)',
        attachments: uploadedAttachments,
      });
      
      setMessage('');
      setAttachedFiles([]);
    } catch (error) {
      alert('Error sending message. Please try again later.');
    }
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

  const renderMessage = (msg: any, index: number) => {
    const isCurrentUser = msg.sender?.id === user?.id;
    
    // Check if this is a system message about proposal acceptance
    const isSystemMessage = typeof msg.content === 'string' && 
                           msg.content.includes('This proposal has been accepted');
    
    if (isSystemMessage) {
      return (
        <div
          key={`${msg.id}-${index}`}
          className="flex justify-center mb-4"
        >
          <div className="bg-green-800 text-white rounded-lg px-4 py-2 text-center max-w-[90%]">
            <p>{msg.content}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div
        key={`${msg.id}-${index}`}
        className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isCurrentUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-800'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden relative bg-gray-300">
                {msg.sender?.avatar_url ? (
                  <>
                    <img
                      src={msg.sender.avatar_url}
                      alt={msg.sender.username || "User"}
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
                      {msg.sender?.username?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-700">
                    {msg.sender?.username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <span className="font-medium text-sm">
                {msg.sender?.username}
              </span>
              <span className={`text-xs ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
                {formatTimestamp(msg.created_at)}
              </span>
            </div>
            <p>{msg.content}</p>
            
            {/* Attachments */}
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="space-y-1 mt-1">
                {msg.attachments.map((attachment: any, i: number) => (
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
      <Card className="p-4 h-96 overflow-y-auto mb-4" title="Chat Messages" reference="#">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupMessagesByDate().map(([date, dateMessages]) => (
              <div key={date}>
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-2 text-xs text-gray-500">{date}</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                {dateMessages.map((message, index) => renderMessage(message, index))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card>

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <Card className="p-2" title="Attached Files" reference="#">
          <div className="flex gap-2 flex-wrap">
            {attachedFiles.map((file, index) => (
              <div 
                key={index} 
                className="bg-gray-100 px-2 py-1 rounded flex items-center text-xs"
              >
                <Paperclip size={12} className="mr-1" />
                <span className="truncate max-w-32">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Message Input */}
      <div className="flex gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          rows={2}
          className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
        <button
          onClick={() => document.getElementById('proposal-file-input')?.click()}
          disabled={attachedFiles.length >= 5}
          className="p-3 text-gray-500 hover:text-blue-600 disabled:opacity-50"
        >
          <Paperclip size={20} />
        </button>
        <input
          id="proposal-file-input"
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            onDrop(files);
          }}
          className="hidden"
        />
        <Button
          onClick={handleSendMessage}
          disabled={sendMessage.isLoading || isUploading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-md flex items-center gap-2 h-full"
        >
          <Send size={16} />
          {isUploading ? 'Uploading...' : 'Send'}
        </Button>
      </div>
    </div>
  );
};