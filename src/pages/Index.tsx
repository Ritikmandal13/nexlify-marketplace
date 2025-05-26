
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import FeaturedItems from '@/components/FeaturedItems';
import MapDiscovery from '@/components/MapDiscovery';
import AppFeatures from '@/components/AppFeatures';
import CTASection from '@/components/CTASection';
import WelcomePage from '@/components/WelcomePage';

const Index = () => {
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Check if user has seen welcome page before
    const hasSeenWelcome = localStorage.getItem('nexlify-welcome-seen');
    if (hasSeenWelcome) {
      setShowWelcome(false);
    }
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem('nexlify-welcome-seen', 'true');
    setShowWelcome(false);
  };

  if (showWelcome) {
    return <WelcomePage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <FeaturedItems />
      <MapDiscovery />
      <AppFeatures />
      <CTASection />
      
      {/* Mobile bottom padding to account for bottom navigation */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
};

export default Index;
