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
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);

  useEffect(() => {
    const checkNewUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if this is a new user (created within the last minute)
          const { data: userData, error } = await supabase
            .from('users')
            .select('created_at')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user data:', error);
            return;
          }

          if (userData) {
            const userCreatedAt = new Date(userData.created_at).getTime();
            const oneMinuteAgo = Date.now() - 60000; // 1 minute ago

            // Show welcome page only if the user was created within the last minute
            if (userCreatedAt > oneMinuteAgo) {
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

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e: Event) => {
      // Only prevent default if the event is available
      if (e) {
        e.preventDefault();
        setDeferredPrompt(e as any);
        setShowPwaPrompt(true);
      }
    };

    // Check if the event is supported
    if ('beforeinstallprompt' in window) {
      window.addEventListener('beforeinstallprompt', handler);
    }

    return () => {
      if ('beforeinstallprompt' in window) {
        window.removeEventListener('beforeinstallprompt', handler);
      }
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return;
    }

    try {
      // Show the install prompt
      const result = await (deferredPrompt as any).prompt();
      console.log('Install prompt result:', result);
      
      // Reset the deferred prompt
      setDeferredPrompt(null);
      setShowPwaPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
      setShowPwaPrompt(false);
    }
  };

  if (showWelcome) {
    return <WelcomePage onGetStarted={() => setShowWelcome(false)} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <FeaturedItems />
      <MapDiscovery />
      {showPwaPrompt && (
        <div className="flex flex-col items-center justify-center bg-blue-50 py-4 px-4 mb-4 rounded-lg shadow max-w-xl mx-auto">
          <div className="font-semibold text-lg mb-2">Add to Home Screen for a better experience!</div>
          <button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded shadow hover:from-blue-700 hover:to-purple-700 transition"
            onClick={handleInstallClick}
          >
            Add to Home Screen
          </button>
        </div>
      )}
      <FeaturesSection />
      {/* Mobile bottom padding to account for bottom navigation */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default Index;
