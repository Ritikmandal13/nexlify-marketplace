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
    q: 'Is it safe to use SmartThrift?',
    a: 'Always meet in public places and verify items before paying. SmartThrift provides reviews and chat to help you trade safely.',
    keywords: ['safe', 'safety', 'secure', 'trust', 'scam', 'fraud', 'review']
  },
  {
    q: 'How do I contact support?',
    a: 'If you need help, use this chatbot or email us at support@smartthrift.app.',
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

// AI API keys from environment variables
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function callGeminiAI(prompt) {
  // Check if API key is available
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'undefined' || GEMINI_API_KEY === 'PASTE_YOUR_API_KEY_HERE') {
    return getFallbackResponse(prompt);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
  
  // Create SmartThrift-specific system prompt
  const systemContext = `You are a helpful assistant for SmartThrift, a local marketplace and community platform. 

SmartThrift features:
- Buy and sell items locally with ratings and reviews
- Advanced search filters (price, distance, rating, condition)
- Real-time chat with sellers
- Schedule meetups for safe exchanges
- User profiles with reputation scores
- Favorite listings
- Multiple categories (textbooks, electronics, furniture, etc.)

Answer user questions about SmartThrift features, how to use the app, safety tips, and general marketplace guidance. Keep responses concise (2-3 sentences) and helpful.`;

  const fullPrompt = `${systemContext}\n\nUser Question: ${prompt}\n\nAssistant:`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: fullPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
          topP: 0.9,
          topK: 40
        }
      })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.warn('Gemini API error:', res.status, errorText);
      return getFallbackResponse(prompt);
    }
    
    const data = await res.json();
    
    // Extract response from Gemini's response format
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        const reply = candidate.content.parts[0].text.trim();
        return reply || getFallbackResponse(prompt);
      }
    }
    
    // If response format is unexpected, use fallback
    console.warn('Unexpected Gemini response format:', data);
    return getFallbackResponse(prompt);
  } catch (err) {
    console.error('Gemini AI error:', err);
    return getFallbackResponse(prompt);
  }
}

// Intelligent fallback when AI is unavailable
function getFallbackResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Context-aware responses
  if (lowerPrompt.includes('review') || lowerPrompt.includes('rating')) {
    return "You can leave reviews and ratings on items after completing a transaction. This helps build trust in the SmartThrift community! To see reviews, check the listing detail page.";
  }
  if (lowerPrompt.includes('filter') || lowerPrompt.includes('search') || lowerPrompt.includes('sort')) {
    return "You can use our advanced filters to search for items! Filter by price range, distance, rating, and condition. You can also sort by newest, price, or ratings. Try the filter panel on the marketplace page!";
  }
  if (lowerPrompt.includes('favorite') || lowerPrompt.includes('save') || lowerPrompt.includes('bookmark')) {
    return "You can favorite items by clicking the heart icon on any listing. View all your favorites in the 'My Favorites' section from your profile menu.";
  }
  if (lowerPrompt.includes('chat') || lowerPrompt.includes('message')) {
    return "To message a seller, click 'Message Seller' on any listing. You'll be able to chat in real-time to discuss details, negotiate, or ask questions!";
  }
  if (lowerPrompt.includes('location') || lowerPrompt.includes('distance') || lowerPrompt.includes('nearby')) {
    return "SmartThrift shows items near you! You can filter by distance (1km, 5km, 10km, 25km) to find sellers nearby. Always meet in public places for safety!";
  }
  if (lowerPrompt.includes('price') || lowerPrompt.includes('cost') || lowerPrompt.includes('expensive')) {
    return "Use the price range filter to find items within your budget! Slide the price range selector to set your min and max price. You can also sort by 'Price: Low to High' to find the best deals!";
  }
  if (lowerPrompt.includes('account') || lowerPrompt.includes('profile') || lowerPrompt.includes('signup')) {
    return "To create an account, click 'Join SmartThrift' and sign up with your email. You'll be able to create listings, message sellers, and build your reputation with reviews!";
  }
  
  // Default helpful response
  return "I'm here to help with SmartThrift! You can ask me about:\n• Buying or selling items\n• Using filters and search\n• Reviews and ratings\n• Messaging sellers\n• Meetups and safety\n• Your account\n\nTry one of the quick question buttons below, or ask me anything!";
}

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! I am SmartThrift Assistant. How can I help you today?' }
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
        // Call Gemini AI
        setMessages(msgs => [
          ...msgs,
          { from: 'bot', text: '🤔 Thinking...' }
        ]);
        const aiReply = await callGeminiAI(text);
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
        <div className="fixed bottom-24 right-0 left-0 mx-auto z-50 w-full max-w-xs sm:max-w-sm md:max-w-md max-w-[95vw] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <span className="font-bold">SmartThrift Assistant</span>
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
              className="flex gap-2 w-full"
            >
              <input
                className="flex-1 w-0 min-w-0 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your question..."
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
                disabled={loading}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 flex items-center justify-center flex-shrink-0"
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