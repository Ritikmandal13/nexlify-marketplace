
import React from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import FeaturedItems from '@/components/FeaturedItems';
import MapDiscovery from '@/components/MapDiscovery';
import AppFeatures from '@/components/AppFeatures';
import CTASection from '@/components/CTASection';

const Index = () => {
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
