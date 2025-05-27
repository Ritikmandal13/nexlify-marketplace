import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import FeaturedItems from '@/components/FeaturedItems';
import MapDiscovery from '@/components/MapDiscovery';
import AppFeatures from '@/components/AppFeatures';
import WelcomePage from '@/components/WelcomePage';

const Index = () => {
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Always show welcome page for a few seconds on every load
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 3000); // 3 seconds
    return () => clearTimeout(timer);
  }, []);

  if (showWelcome) {
    return <WelcomePage onGetStarted={() => setShowWelcome(false)} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <FeaturedItems />
      <MapDiscovery />
      <AppFeatures />
      {/* Mobile bottom padding to account for bottom navigation */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default Index;
