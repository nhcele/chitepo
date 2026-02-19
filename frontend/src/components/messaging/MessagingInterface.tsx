import React, { useState, useEffect, useRef } from 'react';
import {
  PaperAirplaneIcon,
  EnvelopeIcon,
  ArchiveBoxIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { messagingApi, Message, ConversationSummary } from '../../lib/api/messaging';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface MessagingInterfaceProps {
  courseId?: string;
  otherUserId?: string;
  isInstructor?: boolean;
}

export default function MessagingInterface({
  courseId,
  otherUserId,
  isInstructor = false,
}: MessagingInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(otherUserId || null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (courseId && selectedConversation) {
      loadConversation();
    } else if (isInstructor && courseId) {
      loadConversations();
    } else {
      loadInbox();
    }
    loadUnreadCount();
  }, [courseId, selectedConversation, isInstructor]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    if (!courseId || !selectedConversation) return;
    try {
      setLoading(true);
      const data = await messagingApi.getConversation(courseId, selectedConversation);
      setMessages(data);
    } catch (error: any) {
      toast.error('Failed to load conversation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const data = await messagingApi.getCourseConversations(courseId);
      setConversations(data);
    } catch (error: any) {
      toast.error('Failed to load conversations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadInbox = async () => {
    try {
      setLoading(true);
      const data = await messagingApi.getInbox(courseId);
      setMessages(data);
    } catch (error: any) {
      toast.error('Failed to load inbox');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await messagingApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      // Silent fail
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !courseId || !selectedConversation) return;

    try {
      const message = await messagingApi.sendMessage({
        courseId,
        recipientId: selectedConversation,
        content: newMessage.trim(),
      });
      setMessages([...messages, message]);
      setNewMessage('');
      await loadUnreadCount();
      toast.success('Message sent');
    } catch (error: any) {
      toast.error('Failed to send message');
      console.error(error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await messagingApi.markAsRead(messageId);
      setMessages((msgs) =>
        msgs.map((msg) => (msg.id === messageId ? { ...msg, status: 'read' as const } : msg))
      );
      await loadUnreadCount();
    } catch (error) {
      // Silent fail
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Instructor view with conversation list
  if (isInstructor && courseId && !selectedConversation) {
    return (
      <div className="bg-white rounded-lg shadow h-[600px] flex">
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                {unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.studentId}
                  onClick={() => setSelectedConversation(conv.studentId)}
                  className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{conv.student.name}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {conv.lastMessage.content}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">Select a conversation to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  // Conversation view
  return (
    <div className="bg-white rounded-lg shadow h-[600px] flex flex-col">
      {isInstructor && conversations.length > 0 && (
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.studentId}
                onClick={() => setSelectedConversation(conv.studentId)}
                className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 ${
                  selectedConversation === conv.studentId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{conv.student.name}</p>
                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                      {conv.lastMessage.content}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col ${isInstructor ? '' : 'w-full'}`}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  onMouseEnter={() => {
                    if (message.status !== 'read' && !isOwn) {
                      markAsRead(message.id);
                    }
                  }}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-xs opacity-70">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </span>
                      {isOwn && message.status === 'read' && (
                        <CheckIcon className="h-3 w-3 opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selectedConversation && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

