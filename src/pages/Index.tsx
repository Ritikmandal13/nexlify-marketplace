import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import FeaturedItems from '@/components/FeaturedItems';
import MapDiscovery from '@/components/MapDiscovery';
import AppFeatures from '@/components/AppFeatures';
import WelcomePage from '@/components/WelcomePage';
import FeaturesSection from '@/components/FeaturesSection';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'textbooks', label: 'Textbooks' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'sports equipment', label: 'Sports Equipment' },
    { value: 'music instruments', label: 'Music Instruments' },
    { value: 'other', label: 'Other' }
  ];

  const handleCategoryClick = (catValue: string) => {
    setSelectedCategory(catValue);
    navigate(`/marketplace?category=${encodeURIComponent(catValue)}`);
  };

  useEffect(() => {
    const checkNewUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          // Check if this is a new user (created within the last 24 hours) and hasn't seen the welcome page
          const { data: userData, error } = await supabase
            .from('profiles')
            .select('created_at, has_seen_welcome')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
            return;
          }

          if (userData) {
            const userCreatedAt = new Date(userData.created_at).getTime();
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
            if (userCreatedAt > oneDayAgo && !userData.has_seen_welcome) {
              setShowWelcome(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking new user:', error);
      }
    };
    checkNewUser();
  }, []);

  const handleWelcomeComplete = async () => {
    setShowWelcome(false);
    if (userId) {
      await supabase
        .from('profiles')
        .update({ has_seen_welcome: true })
        .eq('id', userId);
    }
  };

  if (showWelcome) {
    return <WelcomePage onGetStarted={handleWelcomeComplete} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      {/* Category Bar on Homepage */}
      <div className="w-full overflow-x-auto py-2 mb-4">
        <div className="flex gap-2 min-w-max px-4">
          {categories.map(cat => (
            <button
              key={cat.value}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition border border-gray-200 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                ${selectedCategory === cat.value
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
                  : 'bg-gray-100 text-gray-800 hover:bg-blue-50'}
              `}
              onClick={() => handleCategoryClick(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <FeaturedItems />
      <FeaturesSection />
      {/* Mobile bottom padding to account for bottom navigation */}
      <div className="h-20 md:h-0"></div>
      {/* Beautiful Footer */}
      <footer className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200 mt-8 mb-24 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SmartThrift</span>
            <span className="text-gray-500 text-sm">| Your Local Campus Marketplace</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-600">
            <a href="#about" className="hover:text-blue-600 transition">About</a>
            <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
            <a href="#privacy" className="hover:text-blue-600 transition">Privacy Policy</a>
          </div>
          <div className="text-xs text-gray-400 text-center md:text-right w-full md:w-auto">&copy; {new Date().getFullYear()} SmartThrift. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
