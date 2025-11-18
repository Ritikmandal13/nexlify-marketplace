import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Trash2, ArrowLeft, Check, CheckCheck } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface Chat {
  id: string;
  user_ids: string[];
  created_at: string;
}

const ChatDetail = () => {
  const { id: chatId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when component is visible
  const markMessagesAsRead = async (userId: string) => {
    if (!chatId) return;
    
    try {
      console.log(`ChatDetail: Checking for unread messages in chat ${chatId}...`);
      
      const { data: unreadMessages, error: fetchError } = await supabase
        .from('messages')
        .select('id')
        .eq('chat_id', chatId)
        .eq('is_read', false)
        .neq('sender_id', userId);

      if (fetchError) {
        console.error('Error fetching unread messages:', fetchError);
        return;
      }

      if (unreadMessages && unreadMessages.length > 0) {
        console.log(`ChatDetail: Found ${unreadMessages.length} unread messages, marking as read...`);
        
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMessages.map((msg) => msg.id));
        
        if (updateError) {
          console.error('Error updating messages:', updateError);
        } else {
          console.log(`ChatDetail: Successfully marked ${unreadMessages.length} messages as read`);
          
          // Update local state to reflect read status immediately
          setMessages(prev => 
            prev.map(msg => 
              unreadMessages.some(um => um.id === msg.id) 
                ? { ...msg, is_read: true } 
                : msg
            )
          );
        }
      } else {
        console.log('ChatDetail: No unread messages found');
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
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
      // Fetch the user's profile to get full_name
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', user.id)
        .single();
      if (error || !profile) {
        setCurrentUser(user); // fallback to basic user
        fetchChatData(user);
      } else {
        setCurrentUser({ ...user, full_name: profile.full_name, avatar_url: profile.avatar_url });
        fetchChatData({ ...user, full_name: profile.full_name, avatar_url: profile.avatar_url });
      }
    };

    const fetchChatData = async (user) => {
      // Fetch chat details
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (chatError || !chatData) {
        toast({
          title: "Error",
          description: "Chat not found.",
          variant: "destructive"
        });
        navigate('/chat');
        return;
      }

      setChat(chatData);

      // Get other user's ID
      const otherUserId = chatData.user_ids.find((id: string) => id !== user.id);
      if (!otherUserId) {
        toast({
          title: "Error",
          description: "Invalid chat user_ids.",
          variant: "destructive"
        });
        navigate('/chat');
        return;
      }

      // Fetch other user's profile
      const { data: otherUserData, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', otherUserId)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
        toast({
          title: "Error",
          description: "Failed to load user profile.",
          variant: "destructive"
        });
        return;
      }

      setOtherUser(otherUserData);

      // Fetch existing messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }

      if (messagesData) {
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      }

      // Mark unread messages as read immediately
      await markMessagesAsRead(user.id);
    };

    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const initializeChat = async () => {
      await fetchUserProfile();
      
      // Set up real-time subscription after user is loaded
      subscription = supabase
        .channel(`chat-${chatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`,
          },
          async (payload) => {
            console.log('ChatDetail: New message received:', payload);
            const newMessage = payload.new as Message;
            setMessages((prev) => {
              // Check if message already exists to prevent duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) return prev;
              return [...prev, newMessage];
            });

            // Mark message as read immediately if we're the recipient and page is visible
            if (newMessage.sender_id !== currentUser?.id && !document.hidden) {
              console.log(`ChatDetail: Marking new message ${newMessage.id} as read...`);
              const { error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id);
              
              if (error) {
                console.error('Error marking new message as read:', error);
              } else {
                console.log(`ChatDetail: Successfully marked new message ${newMessage.id} as read`);
                // Update local state
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === newMessage.id ? { ...msg, is_read: true } : msg
                  )
                );
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            console.log('Message updated:', payload);
            const updatedMessage = payload.new as Message;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );
          }
        )
        .subscribe((status) => {
          console.log('Chat subscription status:', status);
        });
    };

    initializeChat();

    // Mark messages as read when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser) {
        console.log('Page visible, marking messages as read...');
        markMessagesAsRead(currentUser.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (subscription) {
        console.log('Unsubscribing from chat channel');
        subscription.unsubscribe();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [chatId, navigate, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !chatId) return;

    // Insert the message
    const { error: messageError } = await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUser.id,
      content: newMessage.trim(),
      is_read: false,
    });

    if (messageError) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Update chat with last message and time
    await supabase
      .from('chats')
      .update({
        last_message: newMessage.trim(),
        last_message_time: new Date().toISOString(),
      })
      .eq('id', chatId);

    // Find the recipient (other user in the chat)
    const recipientId = chat?.user_ids.find((id: string) => id !== currentUser.id);
    setNewMessage('');
  };

  const handleDeleteChat = async () => {
    if (!chatId) return;
    try {
      // Delete all messages for this chat
      await supabase.from('messages').delete().eq('chat_id', chatId);
      // Delete the chat itself
      await supabase.from('chats').delete().eq('id', chatId);
      toast({
        title: 'Chat Deleted',
        description: 'The chat and all its messages have been deleted.',
      });
      navigate('/chats');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete chat.',
        variant: 'destructive',
      });
    }
  };

  if (!chat || !otherUser) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-white">Loading chat...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col items-center">
        <div className="w-full max-w-2xl flex flex-col h-screen pb-20">
          {/* Sticky Chat Header */}
          <div className="sticky top-16 z-20 bg-white/80 dark:bg-black/90 backdrop-blur border-b border-gray-200 dark:border-black h-20 flex items-center">
            <div className="flex items-center gap-4 px-4 w-full">
              {/* Back Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/chat')}
                className="mr-2 dark:text-white"
                title="Back"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
              {otherUser.avatar_url ? (
                <img
                  src={
                    otherUser.avatar_url.startsWith('http')
                      ? otherUser.avatar_url
                      : `https://spjvuhlgitqnthcvnpyb.supabase.co/storage/v1/object/public/avatars/${otherUser.avatar_url}`
                  }
                  alt={otherUser.full_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                  {otherUser.full_name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate text-lg text-gray-900 dark:text-white">
                  {otherUser.full_name}
                </h2>
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                title="Delete Chat"
                className="dark:bg-red-700 dark:hover:bg-red-800"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto w-full">
            <div className="py-4 pb-32">
              {Array.isArray(messages) && messages.length > 0 ? (
                <div className="flex flex-col gap-3 w-full">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex w-full ${
                        message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm text-sm break-words relative ${
                          message.sender_id === currentUser.id
                            ? 'bg-blue-600 text-white rounded-br-md ml-8'
                            : 'bg-white dark:bg-black text-gray-900 dark:text-white rounded-bl-md mr-8 border dark:border-gray-800'
                        }`}
                      >
                        {message.content}
                        <div className="flex items-center justify-end gap-1 text-xs mt-1 opacity-60 dark:text-gray-300">
                          <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {message.sender_id === currentUser.id && (
                            message.is_read ? (
                              <CheckCheck size={16} className="text-green-400" />
                            ) : (
                              <Check size={16} className="text-gray-300" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-400">
                  No messages yet. Start the conversation!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {/* Fixed Message Input Bar */}
          <div className="fixed bottom-16 left-0 right-0 z-30 bg-white dark:bg-black px-2 py-2 border-t border-gray-200 dark:border-gray-800 max-w-2xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2 bg-white dark:bg-black rounded-xl shadow-md p-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border-none focus:ring-0 focus:outline-none bg-transparent dark:text-white dark:placeholder-gray-400"
                autoFocus
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatDetail; 
                        }`}
                      >
                        {message.content}
                        <div className="flex items-center justify-end gap-1 text-xs mt-1 opacity-60 dark:text-gray-300">
                          <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {message.sender_id === currentUser.id && (
                            message.is_read ? (
                              <CheckCheck size={16} className="text-green-400" />
                            ) : (
                              <Check size={16} className="text-gray-300" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-400">
                  No messages yet. Start the conversation!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          {/* Fixed Message Input Bar */}
          <div className="fixed bottom-16 left-0 right-0 z-30 bg-white dark:bg-black px-2 py-2 border-t border-gray-200 dark:border-gray-800 max-w-2xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2 bg-white dark:bg-black rounded-xl shadow-md p-2">
              <Input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 border-none focus:ring-0 focus:outline-none bg-transparent dark:text-white dark:placeholder-gray-400"
                autoFocus
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChat} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ChatDetail; 