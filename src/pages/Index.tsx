import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import FeaturedItems from '@/components/FeaturedItems';
import MapDiscovery from '@/components/MapDiscovery';
import AppFeatures from '@/components/AppFeatures';
import WelcomePage from '@/components/WelcomePage';
import FeaturesSection from '@/components/FeaturesSection';
import { supabase } from '@/lib/supabaseClient';

const Index = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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
      <FeaturedItems />
      <MapDiscovery />
      <FeaturesSection />
      {/* Mobile bottom padding to account for bottom navigation */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default Index;
