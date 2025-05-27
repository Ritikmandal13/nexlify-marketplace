import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
}

interface Chat {
  id: string;
  user_ids: string[];
  product_id?: string;
  product?: Product;
}

export default function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChatData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setCurrentUserId(user.id);

      // Fetch chat details
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          *,
          product:listings (
            id,
            title,
            price,
            images
          )
        `)
        .eq('id', chatId)
        .single();

      if (chatError || !chatData) {
        navigate('/chats');
        return;
      }

      setChat(chatData);

      // Get other user's ID
      const otherUserId = chatData.user_ids.find((id: string) => id !== user.id);
      
      // Fetch other user's profile
      const { data: otherUserData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();

      setOtherUser(otherUserData);

      // Fetch existing messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesData) {
        setMessages(messagesData);
      }

      // Mark unread messages as read
      const unreadMessages = messagesData?.filter(
        (msg) => !msg.is_read && msg.sender_id !== user.id
      );

      if (unreadMessages?.length) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map((msg) => msg.id));
      }
    };

    fetchChatData();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          // Mark message as read if we're the recipient
          if (newMessage.sender_id !== currentUserId) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [chatId, navigate, currentUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId || !chatId) return;

    const { error } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUserId,
      content: newMessage.trim(),
      is_read: false,
    });

    if (!error) {
      setNewMessage('');
    }
  };

  if (!chat || !otherUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="text-center text-gray-500">Loading chat...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-2xl mx-auto flex flex-col flex-1 px-2 py-2 w-full">
        {/* Chat Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="flex items-center gap-4 p-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherUser.avatar_url} />
              <AvatarFallback>
                {otherUser.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold truncate text-lg text-gray-900">{otherUser.full_name}</h2>
                {/* You can add online status or icons here */}
              </div>
              {chat.product && (
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={chat.product.images?.[0] || '/placeholder.png'}
                    alt={chat.product.title}
                    className="h-6 w-6 rounded object-cover border"
                  />
                  <span className="text-sm text-gray-600 truncate max-w-[120px]">
                    {chat.product.title}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto py-4 pb-36 w-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex w-full ${
                    message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm break-words relative ${
                      message.sender_id === currentUserId
                        ? 'bg-blue-600 text-white rounded-br-md ml-8'
                        : 'bg-white text-gray-900 rounded-bl-md mr-8 border'
                    }`}
                  >
                    {message.content}
                    <div className="text-xs mt-1 text-right opacity-60">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - fixed above the nav bar */}
        <div className="fixed bottom-20 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="max-w-2xl w-full px-2 pointer-events-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2 bg-white border border-gray-200 rounded-xl shadow-md p-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border-none focus:ring-0 focus:outline-none bg-transparent"
                autoFocus
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      {/* Navigation at the very bottom */}
      <Navigation />
    </div>
  );
} 