import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

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
    };
    checkUser();
  }, [navigate, toast]);

  const fetchChats = async (userId: string) => {
    try {
      // Fetch all chats where the current user is a participant
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .contains('user_ids', [userId]);

      if (chatError) throw chatError;

      // For each chat, get the other user's details
      const chatsWithUsers = await Promise.all(
        chatData.map(async (chat) => {
          const otherUserId = chat.user_ids.find(id => id !== userId);
          if (!otherUserId) return { ...chat };

          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          if (userError) {
            console.error('Error fetching user:', userError);
            return { ...chat };
          }

          return {
            ...chat,
            other_user: userData
          };
        })
      );

      setChats(chatsWithUsers);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

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
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {chat.other_user?.full_name || 'Unknown User'}
                          </h3>
                          {chat.last_message_time && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(chat.last_message_time)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
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