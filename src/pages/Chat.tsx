import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Send, MessageSquare, Moon, Sun } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/context/ThemeContext';
import { Skeleton } from '@/components/ui/skeleton';

interface Chat {
  id: string;
  created_at: string;
  user_ids: string[];
  last_message?: string;
  last_message_time?: string;
  other_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  unread_count: number;
}

const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchChats = useCallback(async (userId: string) => {
    try {
      // Fetch all chats where the current user is a participant
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .contains('user_ids', [userId]);

      if (chatError) throw chatError;

      // For each chat, get the other user's details and unread count
      const chatsWithUsers = await Promise.all(
        chatData.map(async (chat) => {
          const otherUserId = chat.user_ids.find(id => id !== userId);
          if (!otherUserId) return { ...chat, unread_count: 0 };

          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          if (userError) {
            console.error('Error fetching user:', userError);
            return { ...chat, unread_count: 0 };
          }

          // Count unread messages for this chat (messages not sent by current user and not read)
          const { count: unreadCount, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .eq('is_read', false)
            .neq('sender_id', userId);

          if (countError) {
            console.error('Error counting unread messages:', countError);
          }

          return {
            ...chat,
            other_user: userData,
            unread_count: unreadCount || 0
          };
        })
      );

      setChats(chatsWithUsers);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access chat.",
          variant: "destructive"
        });
        navigate('/signin');
        return;
      }
      setCurrentUser(user);
      fetchChats(user.id);

      // Subscribe to real-time updates for messages
      const messagesSubscription = supabase
        .channel('messages-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            console.log('Message change detected:', payload);
            // Small delay to ensure database has updated
            setTimeout(() => {
              fetchChats(user.id);
            }, 100);
          }
        )
        .subscribe();

      // Subscribe to chat updates (for last_message changes)
      const chatsSubscription = supabase
        .channel('chats-channel')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'chats',
          },
          (payload) => {
            console.log('Chat updated:', payload);
            // Refetch chats to get latest last_message
            fetchChats(user.id);
          }
        )
        .subscribe();

      // Refetch when page becomes visible (user returns from chat detail)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          console.log('Page visible, refetching chats...');
          fetchChats(user.id);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        messagesSubscription.unsubscribe();
        chatsSubscription.unsubscribe();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };

    const subscription = checkUser();
    
    return () => {
      if (subscription && typeof subscription.then === 'function') {
        subscription.then(cleanup => {
          if (cleanup) cleanup();
        });
      }
    };
  }, [navigate, toast, fetchChats]);

  // Refetch chats when returning to this page
  useEffect(() => {
    if (currentUser && location.pathname === '/chat') {
      console.log('Returned to chat list, refetching...');
      fetchChats(currentUser.id);
    }
  }, [location.pathname, currentUser, fetchChats]);

  const filteredChats = chats.filter(chat =>
    chat.other_user?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-7xl w-full px-4 py-6">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={16} />
              <Input
                placeholder="Search conversations..."
                className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Chat List */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No messages</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start a conversation with other users.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChats.map((chat) => (
                <Card 
                  key={chat.id} 
                  className="hover:shadow-lg focus:shadow-lg transition-shadow cursor-pointer relative dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-100 dark:hover:bg-gray-900 hover:scale-[1.02] focus:bg-gray-100 dark:focus:bg-gray-900"
                  tabIndex={0}
                >
                  <CardContent className="p-4" onClick={async () => {
                    navigate(`/chat/${chat.id}`);
                  }}>
                    <div className="flex items-center space-x-4">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-medium absolute top-0 left-0 z-0">
                          {chat.other_user?.full_name?.charAt(0) || 'U'}
                        </div>
                        {chat.other_user?.avatar_url && chat.other_user.avatar_url.trim() !== "" && (
                          <img
                            key={chat.other_user.avatar_url}
                            src={
                              chat.other_user.avatar_url.startsWith('http')
                                ? chat.other_user.avatar_url
                                : `https://spjvuhlgitqnthcvnpyb.supabase.co/storage/v1/object/public/avatars/${chat.other_user.avatar_url}`
                            }
                            alt={chat.other_user.full_name + ' avatar'}
                            className="w-12 h-12 rounded-full object-cover absolute top-0 left-0 z-10"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        {/* Unread Badge */}
                        {chat.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 z-20 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                            {chat.unread_count > 9 ? '9+' : chat.unread_count}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-sm font-medium truncate ${
                            chat.unread_count > 0 
                              ? 'text-gray-900 dark:text-white font-bold' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {chat.other_user?.full_name || 'Unknown User'}
                          </h3>
                          {chat.last_message_time && (
                            <span className={`text-xs ${
                              chat.unread_count > 0 
                                ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatTime(chat.last_message_time)}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${
                          chat.unread_count > 0 
                            ? 'text-gray-900 dark:text-white font-semibold' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {chat.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Chat; 