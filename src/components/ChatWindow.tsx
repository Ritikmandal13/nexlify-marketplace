import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId, currentUserId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      if (!error) setMessages(data || []);
      setLoading(false);
    };
    fetchMessages();
  }, [chatId]);

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel('realtime:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a new message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await supabase.from('messages').insert({
      chat_id: chatId,
      sender_id: currentUserId,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full max-h-[500px] border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 shadow-md">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500">No messages yet.</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs break-words shadow-sm ${
                  msg.sender_id === currentUserId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                {msg.content}
                <div className={`text-xs mt-1 text-right ${
                  msg.sender_id === currentUserId
                    ? 'text-blue-100'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex p-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <Input
          className="flex-1 mr-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button type="submit" disabled={!newMessage.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow; 