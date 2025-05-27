import React, { useState, useEffect } from 'react';
import { Search, MapPin, MessageCircle, User, Menu, X, Plus, Home, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import UserProfile from '@/components/auth/UserProfile';
import { supabase } from '@/lib/supabaseClient';
import { AuthUser } from '@/types/user';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleProfileClick = () => {
    setIsProfileOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-lg sticky top-0 z-50">
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
              <a href="#discover" className="text-gray-700 hover:text-blue-600 transition-colors">
                Discover
              </a>
              <a href="#sell" className="text-gray-700 hover:text-blue-600 transition-colors">
                Sell
              </a>
              <Link to="/chats" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1">
                <MessageCircle size={18} />
                Chat
              </Link>
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Hi, {(user.user_metadata?.full_name || user.email || '').split(' ')[0]}</span>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
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
                      className="flex items-center gap-2"
                    >
                      <User size={16} />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-4">
                <a href="#discover" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Discover
                </a>
                <a href="#sell" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Sell
                </a>
                <Link to="/chats" className="text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-1">
                  <MessageCircle size={18} />
                  Chat
                </Link>
                {user ? (
                  <>
                    <div className="text-gray-700 py-2 border-t">
                      Hi, {(user.user_metadata?.full_name || user.email || '').split(' ')[0]}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleProfileClick}
                    >
                      Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/signin">
                      <Button 
                        variant="outline" 
                        className="w-full"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                      >
                        Join Nexlify
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
          <div className="flex justify-around items-center relative">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1" onClick={() => navigate('/') }>
              <Home size={20} />
              <span className="text-xs">Home</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1" onClick={() => navigate('/marketplace') }>
              <ShoppingBag size={20} />
              <span className="text-xs">Market</span>
            </Button>
            {/* Floating Sell Button (FAB) for mobile */}
            {user && (
              <button
                className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg p-3 hover:scale-105 transition-transform flex items-center justify-center border-4 border-white z-50"
                onClick={() => navigate('/create-listing')}
                aria-label="Sell Item"
                style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
              >
                <Plus size={22} />
              </button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1"
              onClick={() => navigate('/chats')}
            >
              <MessageCircle size={20} />
              <span className="text-xs">Chat</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1"
              onClick={user ? handleProfileClick : undefined}
            >
              <User size={20} />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </nav>

      <UserProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Floating Sell Button (FAB) for desktop */}
      {user && (
        <button
          className="hidden md:flex fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg p-4 hover:scale-105 transition-transform items-center justify-center"
          onClick={() => navigate('/create-listing')}
          aria-label="Sell Item"
        >
          <Plus size={28} />
        </button>
      )}
    </>
  );
};

export default Navigation;
