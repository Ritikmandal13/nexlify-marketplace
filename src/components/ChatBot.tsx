import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const FAQS = [
  {
    q: 'How do I buy an item?',
    a: 'To buy an item, browse the marketplace, select a listing, and click the "Message Seller" or "Schedule Meetup" button.',
    keywords: ['buy', 'purchase', 'get', 'item', 'listing', 'message seller', 'schedule meetup']
  },
  {
    q: 'How do I sell an item?',
    a: 'To sell, click the "+" or "Sell Item" button, fill out the listing form, and submit your item for others to see.',
    keywords: ['sell', 'listing', 'add', 'post', 'item', 'form']
  },
  {
    q: 'How do meetups work?',
    a: 'Meetups let buyers and sellers agree on a time and place to exchange items. Use the "Schedule Meetup" button on a listing.',
    keywords: ['meetup', 'meet', 'exchange', 'schedule', 'place', 'time', 'arrange']
  },
  {
    q: 'How do I pay or get paid?',
    a: 'Payments are handled via UPI. After a successful meetup, the buyer can pay the seller using the provided UPI ID.',
    keywords: ['pay', 'payment', 'upi', 'get paid', 'send money', 'receive', 'money']
  },
  {
    q: 'Is it safe to use Nexlify?',
    a: 'Always meet in public places and verify items before paying. Nexlify provides reviews and chat to help you trade safely.',
    keywords: ['safe', 'safety', 'secure', 'trust', 'scam', 'fraud', 'review']
  },
  {
    q: 'How do I contact support?',
    a: 'If you need help, use this chatbot or email us at support@nexlify.app.',
    keywords: ['support', 'help', 'contact', 'email', 'problem', 'issue']
  }
];

function matchFAQ(input) {
  input = input.toLowerCase();
  // First, try exact question match
  for (const faq of FAQS) {
    if (input === faq.q.toLowerCase()) {
      return faq.a;
    }
  }
  // Then, try keyword match
  for (const faq of FAQS) {
    if (faq.keywords.some(kw => input.includes(kw))) {
      return faq.a;
    }
  }
  return null;
}

// Hugging Face API key from environment variable
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
const HF_MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";

async function callHuggingFace(prompt) {
  const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  const systemPrompt = "You are Nexlify's helpful support assistant. Answer questions about the Nexlify marketplace app, buying, selling, meetups, payments, and safety. If the question is not about Nexlify, politely say you can only help with Nexlify-related topics.";
  const userPrompt = `${systemPrompt}\n\nUser: ${prompt}\nAssistant:`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: userPrompt })
    });
    const data = await res.json();
    let reply = data[0]?.generated_text || "Sorry, I couldn't get a response from Hugging Face.";
    // Extract only the assistant's reply
    if (reply.includes("Assistant:")) {
      reply = reply.split("Assistant:").pop().trim();
    }
    return reply;
  } catch (err) {
    return "Sorry, there was an error contacting Hugging Face.";
  }
}

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am Nexlify Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async (text) => {
    if (!text.trim()) return;
    setMessages(msgs => [...msgs, { from: 'user', text }]);
    setInput('');
    setLoading(true);
    setTimeout(async () => {
      const answer = matchFAQ(text);
      if (answer) {
        setMessages(msgs => [
          ...msgs,
          { from: 'bot', text: answer }
        ]);
        setLoading(false);
      } else {
        // Call Hugging Face
        setMessages(msgs => [
          ...msgs,
          { from: 'bot', text: 'Thinking...' }
        ]);
        const aiReply = await callHuggingFace(text);
        setMessages(msgs => [
          ...msgs.slice(0, -1), // remove 'Thinking...'
          { from: 'bot', text: aiReply }
        ]);
        setLoading(false);
      }
    }, 400);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className="fixed bottom-24 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:scale-105 transition"
        onClick={() => setOpen(true)}
        aria-label="Open chatbot"
        style={{ display: open ? 'none' : 'block' }}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Modal */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-64 max-w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <span className="font-bold">Nexlify Assistant</span>
            <button onClick={() => setOpen(false)} aria-label="Close chatbot">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50 dark:bg-gray-950" style={{ maxHeight: 250 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${msg.from === 'user' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2"
            >
              <input
                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your question..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
                disabled={loading}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 flex items-center justify-center"
                aria-label="Send"
                disabled={loading}
              >
                <Send size={18} />
              </button>
            </form>
            {/* FAQ Quick Buttons */}
            <div className="mt-2 flex flex-row flex-wrap gap-x-2 gap-y-1">
              {FAQS.map((faq, i) => (
                <button
                  key={i}
                  className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full px-3 py-1 text-xs hover:bg-blue-100 dark:hover:bg-blue-900 transition"
                  onClick={() => handleSend(faq.q)}
                  type="button"
                >
                  {faq.q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot; 