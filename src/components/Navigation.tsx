import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, MessageCircle, User, Menu, X, Plus, Home, ShoppingBag, Heart, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import UserProfile from '@/components/auth/UserProfile';
import { supabase } from '@/lib/supabaseClient';
import { AuthUser } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/context/ThemeContext';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [hasPendingMeetups, setHasPendingMeetups] = useState(false);
  const [pendingMeetupCount, setPendingMeetupCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Fetch unread messages count - moved outside to avoid duplication
  const fetchUnreadMessagesCount = useCallback(async (userId: string) => {
    try {
      console.log('Navigation: Fetching unread messages count...');
      
      // First, get all chats where user is a participant
      const { data: userChats, error: chatsError } = await supabase
        .from('chats')
        .select('id')
        .contains('user_ids', [userId]);

      if (chatsError) throw chatsError;

      if (!userChats || userChats.length === 0) {
        console.log('Navigation: No chats found, setting count to 0');
        setUnreadMessagesCount(0);
        return;
      }

      // Extract chat IDs
      const chatIds = userChats.map(chat => chat.id);
      console.log(`Navigation: Checking ${chatIds.length} chats for unread messages`);

      // Count unread messages only from these active chats
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('chat_id', chatIds)
        .eq('is_read', false)
        .neq('sender_id', userId);
      
      if (!error && count !== null) {
        console.log(`Navigation: Found ${count} unread messages`);
        setUnreadMessagesCount(count);
      } else {
        console.log('Navigation: Error or no count, setting to 0');
        setUnreadMessagesCount(0);
      }
    } catch (error) {
      console.error('Navigation: Error fetching unread count:', error);
      setUnreadMessagesCount(0);
    }
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user as AuthUser | null);
      setLoading(false);
      if (user) {
        // Fetch avatar_url from profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        if (data && data.avatar_url) {
          if (data.avatar_url.startsWith('http')) {
            setAvatarUrl(data.avatar_url);
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(data.avatar_url);
            setAvatarUrl(publicUrlData.publicUrl);
          }
        } else {
          setAvatarUrl(null);
        }
      } else {
        setAvatarUrl(null);
      }
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as AuthUser | null);
      setLoading(false);
      if (session?.user) {
        // Fetch avatar_url on auth state change
        supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => {
            if (data && data.avatar_url) {
              if (data.avatar_url.startsWith('http')) {
                setAvatarUrl(data.avatar_url);
              } else {
                const { data: publicUrlData } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(data.avatar_url);
                setAvatarUrl(publicUrlData.publicUrl);
              }
            } else {
              setAvatarUrl(null);
            }
          });
      } else {
        setAvatarUrl(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Fetch pending meetups for flag
    const fetchPendingMeetups = async (userId: string) => {
      const { data, error } = await supabase
        .from('meetups')
        .select('id')
        .eq('seller_id', userId)
        .eq('status', 'pending');
      if (!error && data) {
        setHasPendingMeetups(data.length > 0);
        setPendingMeetupCount(data.length);
      } else {
        setHasPendingMeetups(false);
        setPendingMeetupCount(0);
      }
    };

    if (user) {
      fetchPendingMeetups(user.id);
      fetchUnreadMessagesCount(user.id);

      // Subscribe to real-time updates for messages
      const messagesSubscription = supabase
        .channel('nav-messages-channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          () => {
            // Immediate refresh for better responsiveness
            console.log('Navigation: Message change detected, refreshing unread count...');
              fetchUnreadMessagesCount(user.id);
          }
        )
        .subscribe();

      // Refetch when page becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchUnreadMessagesCount(user.id);
          fetchPendingMeetups(user.id);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        messagesSubscription.unsubscribe();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      setHasPendingMeetups(false);
      setPendingMeetupCount(0);
      setUnreadMessagesCount(0);
    }
  }, [user, fetchUnreadMessagesCount]);

  // Refetch unread count when route changes (e.g., navigating from chat detail back to chat list)
  useEffect(() => {
    if (user) {
      // Refetch unread messages whenever route changes
      fetchUnreadMessagesCount(user.id);
    }
  }, [routerLocation.pathname, user, fetchUnreadMessagesCount]);

  const handleProfileClick = () => {
    setIsProfileOpen(true);
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSearch = () => {
    navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}&location=${encodeURIComponent(location)}`);
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center h-16 w-full relative">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 z-10">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SmartThrift
              </div>
            </div>
            {/* Search Icon (always visible, right of logo) */}
            <div className="flex-1 flex items-center justify-end z-10 gap-2">
              {/* Show Sign In button left of search if not logged in */}
              {!loading && !user && (
                <Button
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow hover:from-blue-700 hover:to-purple-700 transition text-sm md:text-base"
                  onClick={() => navigate('/signin')}
                >
                  <User size={18} className="mr-2" /> Sign In
                </Button>
              )}
              <Button
                className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-2 shadow"
                onClick={() => setSearchOpen(true)}
                size="icon"
                aria-label="Open search"
              >
                <Search size={20} />
              </Button>
              {/* Hamburger menu button (always in header row) */}
              <div className="md:hidden ml-2 flex items-center relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                  {hasPendingMeetups && (
                    <span className="absolute -top-1 -right-1">
                      <Badge variant="destructive" className="rounded-full px-1.5 py-0.5 text-[10px] h-4 w-4 flex items-center justify-center animate-pulse">
                        {/* Red dot or count */}
                        {pendingMeetupCount > 0 ? pendingMeetupCount : ''}
                      </Badge>
                    </span>
                  )}
                </Button>
              </div>
            </div>
            {/* Expanded Search Overlay (floating, compact, modern) */}
            {searchOpen && (
              <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSearchOpen(false)}>
                <div
                  className="mt-6 w-full max-w-sm bg-white dark:bg-gray-900 rounded-full shadow-lg flex items-center px-4 py-2 relative"
                  onClick={e => e.stopPropagation()}
                >
                  <Search className="text-gray-400 mr-2" size={18} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search for items, categories..."
                    className="flex-1 border-none outline-none bg-transparent text-base"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { handleSearch(); setSearchOpen(false); }
                      if (e.key === 'Escape') setSearchOpen(false);
                    }}
                  />
                  <Button
                    className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-2 ml-1"
                    onClick={() => { handleSearch(); setSearchOpen(false); }}
                    size="icon"
                    aria-label="Submit search"
                  >
                    <Search size={18} />
                  </Button>
                  <Button
                    className="rounded-full text-gray-400 hover:text-gray-700 p-2 ml-1"
                    variant="ghost"
                    onClick={() => setSearchOpen(false)}
                    size="icon"
                    aria-label="Close search"
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center justify-end">
            {/* Desktop Navigation (centered on desktop) */}
            <div className="hidden md:flex items-center space-x-8 mr-4">
              <a href="#discover" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Discover
              </a>
              <a href="#sell" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Sell
              </a>
              <Link to="/chats" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 relative">
                <div className="relative">
                  <MessageCircle size={18} />
                  {unreadMessagesCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </div>
                  )}
                </div>
                Chat
              </Link>
              <Link to="/meetups" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 relative">
                <CalendarDays size={18} />
                Meetups
              </Link>
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 dark:text-gray-200">Hi, {(user.user_metadata?.full_name || user.email || '').split(' ')[0]}</span>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    onClick={handleProfileClick}
                  >
                    <User size={16} />
                    Profile
                  </Button>
                </div>
              ) : (
                <>
                  <Link to="/signup">
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
                    >
                      Join SmartThrift
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div
            className={`fixed inset-0 z-40 flex justify-end items-stretch bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeMenu}
          >
            <div
              className={`relative w-72 max-w-full h-full bg-white/90 dark:bg-gray-900/90 rounded-l-2xl shadow-2xl flex flex-col p-0 animate-slideInRight`}
              onClick={e => e.stopPropagation()}
            >
              <button onClick={closeMenu} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 z-10">
                <X size={28} />
              </button>
              {/* User Info */}
              {user && (
                <div className="flex flex-col items-center gap-2 pt-10 pb-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-50/60 to-purple-50/60 dark:from-gray-800/60 dark:to-gray-900/60">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover border-2 border-blue-400 shadow" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {(user.user_metadata?.full_name || user.email || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="font-semibold text-gray-900 dark:text-white text-lg">{(user.user_metadata?.full_name || user.email || '').split(' ')[0]}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                </div>
              )}
              <div className="flex flex-col gap-2 px-6 py-8">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-base font-semibold flex items-center gap-3 dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-blue-50 dark:hover:text-blue-400 transition"
                  onClick={() => { navigate('/favorites'); closeMenu(); }}
                >
                  <Heart size={22} className="mr-1" /> Favorites
                </Button>
                {user ? (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base font-semibold flex items-center gap-3 dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-blue-50 dark:hover:text-blue-400 transition"
                      onClick={() => { navigate('/create-listing'); closeMenu(); }}
                    >
                      <Plus size={22} className="mr-1" /> Create Listing
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base font-semibold flex items-center gap-3 dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-blue-50 dark:hover:text-blue-400 transition relative"
                      onClick={() => { navigate('/meetups'); closeMenu(); }}
                    >
                      <CalendarDays size={22} className="mr-1" /> Meetups
                      {hasPendingMeetups && (
                        <span className="absolute left-28 top-1">
                          <Badge variant="destructive" className="rounded-full px-1.5 py-0.5 text-[10px] h-4 w-4 flex items-center justify-center animate-pulse">
                            {pendingMeetupCount > 0 ? pendingMeetupCount : ''}
                          </Badge>
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base font-semibold flex items-center gap-3 dark:text-gray-200 dark:hover:bg-gray-800 hover:bg-blue-50 dark:hover:text-blue-400 transition"
                      onClick={() => { navigate('/my-listings'); closeMenu(); }}
                    >
                      <ShoppingBag size={22} className="mr-1" /> My Listings
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-base font-semibold flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800 transition"
                      onClick={handleSignOut}
                    >
                      <X size={22} className="mr-1" /> Sign Out
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              .animate-slideInRight {
                animation: slideInRight 0.35s cubic-bezier(0.4,0,0.2,1);
              }
            `}</style>
          </div>
        )}
      </nav>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 z-40">
        <div className="flex justify-between items-center relative">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 flex-1 dark:text-gray-200 dark:hover:bg-gray-700" onClick={() => navigate('/') }>
            <Home size={20} />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 flex-1 dark:text-gray-200 dark:hover:bg-gray-700" onClick={() => navigate('/marketplace') }>
            <ShoppingBag size={20} />
            <span className="text-xs">Market</span>
          </Button>
          <div className="flex-1 flex items-center justify-center" /> {/* Spacer for FAB */}
          <div className="relative flex-1 flex items-center justify-center">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 flex-1 dark:text-gray-200 dark:hover:bg-gray-700" onClick={() => navigate('/chat') }>
              <div className="relative">
                <MessageCircle size={20} />
                {unreadMessagesCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </div>
                )}
              </div>
              <span className="text-xs">Chat</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 flex-1 dark:text-gray-200 dark:hover:bg-gray-700" onClick={handleProfileClick}>
            <User size={20} />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
      {/* Mobile Floating Plus Button (centered between Market and Chat, slightly lifted) */}
      {user && (
        <>
          <div className="md:hidden">
            <button
              className="fixed left-1/2 bottom-2 -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl p-4 hover:scale-105 transition-transform flex items-center justify-center border-4 border-white dark:border-gray-900"
              onClick={() => navigate('/create-listing')}
              aria-label="Create Listing"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
            >
              <Plus size={28} />
            </button>
          </div>
          {/* Desktop Floating Plus Button (bottom right) */}
          <button
            className="hidden md:flex fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg p-4 hover:scale-105 transition-transform items-center justify-center border-4 border-white dark:border-gray-900"
            onClick={() => navigate('/create-listing')}
            aria-label="Create Listing"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
          >
            <Plus size={28} />
          </button>
        </>
      )}
      {isProfileOpen && <UserProfile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />}
    </>
  );
};

export default Navigation;
