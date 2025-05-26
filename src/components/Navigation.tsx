
import React, { useState, useEffect } from 'react';
import { Search, MapPin, MessageCircle, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModal from '@/components/auth/AuthModal';
import UserProfile from '@/components/auth/UserProfile';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('nexlify-user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  };

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
              <a href="#messages" className="text-gray-700 hover:text-blue-600 transition-colors">
                Messages
              </a>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">Hi, {user.name.split(' ')[0]}</span>
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
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => handleAuthClick('signin')}
                  >
                    <User size={16} />
                    Sign In
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => handleAuthClick('signup')}
                  >
                    Join Nexlify
                  </Button>
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
                <a href="#messages" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Messages
                </a>
                
                {user ? (
                  <>
                    <div className="text-gray-700 py-2 border-t">
                      Hi, {user.name.split(' ')[0]}
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
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleAuthClick('signin')}
                    >
                      Sign In
                    </Button>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                      onClick={() => handleAuthClick('signup')}
                    >
                      Join Nexlify
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex justify-around items-center">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <Search size={20} />
              <span className="text-xs">Search</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <MapPin size={20} />
              <span className="text-xs">Map</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <MessageCircle size={20} />
              <span className="text-xs">Chat</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center gap-1"
              onClick={user ? handleProfileClick : () => handleAuthClick('signin')}
            >
              <User size={20} />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
      
      <UserProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};

export default Navigation;
