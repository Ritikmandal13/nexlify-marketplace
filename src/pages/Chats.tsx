import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Clock, MessageSquarePlus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';

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
  created_at: string;
  product_id?: string;
  lastMessage?: Message;
  otherUser?: UserProfile;
  product?: Product;
}

const Chats = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const filteredChats = chats.filter((chat) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      chat.otherUser?.full_name?.toLowerCase().includes(searchLower) ||
      chat.product?.title?.toLowerCase().includes(searchLower) ||
      chat.lastMessage?.content?.toLowerCase().includes(searchLower)
    );
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const fetchChats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Fetch all chats where the current user is a participant
      const { data: chatsData, error } = await supabase
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
        .contains('user_ids', [user.id]);

      if (error) {
        console.error('Error fetching chats:', error);
        return;
      }

      // Fetch the last message for each chat
      const chatsWithLastMessage = await Promise.all(
        chatsData.map(async (chat) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get the other user's ID
          const otherUserId = chat.user_ids.find((id: string) => id !== user.id);
          
          // Fetch the other user's profile
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();

          return {
            ...chat,
            lastMessage: messages?.[0],
            otherUser,
          };
        })
      );

      setChats(chatsWithLastMessage);
    };

    fetchChats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="sticky top-16 z-10 bg-gray-50 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Messages</h1>
            <Button variant="outline" size="sm">
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search messages..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 pb-20">
          {filteredChats.map((chat) => (
            <Link
              key={chat.id}
              to={`/chat/${chat.id}`}
              className="block"
            >
              <div className="bg-white rounded-lg p-4 hover:bg-gray-50 transition-colors border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.otherUser?.avatar_url} />
                      <AvatarFallback>
                        {chat.otherUser?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {chat.lastMessage?.is_read === false && chat.lastMessage?.sender_id !== currentUserId && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">
                        {chat.otherUser?.full_name || 'Unknown User'}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {chat.lastMessage ? formatTimeAgo(chat.lastMessage.created_at) : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {chat.product && (
                        <div className="flex-shrink-0">
                          <img
                            src={chat.product.images?.[0] || '/placeholder.png'}
                            alt={chat.product.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        </div>
                      )}
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chats; 