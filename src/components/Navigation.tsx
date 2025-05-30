import React, { useState, useEffect } from 'react';
import { Search, MapPin, MessageCircle, User, Menu, X, Plus, Home, ShoppingBag, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import UserProfile from '@/components/auth/UserProfile';
import { supabase } from '@/lib/supabaseClient';
import { AuthUser } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/context/ThemeContext';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user as AuthUser | null);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as AuthUser | null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Subscribe to notifications
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

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

  return (
    <>
      <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Nexlify
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#discover" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Discover
              </a>
              <a href="#sell" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Sell
              </a>
              <Link to="/chats" className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 relative">
                <MessageCircle size={18} />
                Chat
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs">
                    {unreadCount}
                  </Badge>
                )}
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
                  <Link to="/signin">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <User size={16} />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600"
                    >
                      Join Nexlify
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 ${isMenuOpen ? 'block' : 'hidden'}`} onClick={closeMenu}>
              <div className={`fixed inset-y-0 right-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4">
                  <button onClick={closeMenu} className="absolute top-4 right-4 dark:text-gray-200">
                    <X size={24} />
                  </button>
                  <div className="mt-8 space-y-4">
                    <Button
                      variant="ghost"
                      className="w-full justify-start dark:text-gray-200 dark:hover:bg-gray-700"
                      onClick={() => {
                        navigate('/favorites');
                        closeMenu();
                      }}
                    >
                      <Heart size={20} className="mr-2" />
                      Favorites
                    </Button>
                    {user ? (
                      <>
                        <Button
                          variant="ghost"
                          className="w-full justify-start dark:text-gray-200 dark:hover:bg-gray-700"
                          onClick={() => {
                            navigate('/create-listing');
                            closeMenu();
                          }}
                        >
                          <Plus size={20} className="mr-2" />
                          Create Listing
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start dark:text-gray-200 dark:hover:bg-gray-700"
                          onClick={() => {
                            navigate('/my-listings');
                            closeMenu();
                          }}
                        >
                          <ShoppingBag size={20} className="mr-2" />
                          My Listings
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start dark:text-gray-200 dark:hover:bg-gray-700"
                          onClick={() => {
                            navigate('/profile');
                            closeMenu();
                          }}
                        >
                          <User size={20} className="mr-2" />
                          Profile
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                          onClick={handleSignOut}
                        >
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        className="w-full justify-start dark:text-gray-200 dark:hover:bg-gray-700"
                        onClick={() => {
                          navigate('/login');
                          closeMenu();
                        }}
                      >
                        <User size={20} className="mr-2" />
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

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
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 flex-1 dark:text-gray-200 dark:hover:bg-gray-700" onClick={() => navigate('/chat') }>
              <MessageCircle size={20} />
              <span className="text-xs">Chat</span>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 flex-1 dark:text-gray-200 dark:hover:bg-gray-700" onClick={handleProfileClick}>
              <User size={20} />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </nav>
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
