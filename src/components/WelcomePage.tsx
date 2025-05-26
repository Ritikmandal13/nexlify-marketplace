
import React, { useState } from 'react';
import { ChevronRight, MapPin, MessageCircle, Shield, Zap, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WelcomePage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to Nexlify",
      subtitle: "Your Local Campus Marketplace",
      description: "Buy and sell with classmates, neighbors, and your local community. Discover amazing deals just around the corner.",
      icon: <Heart className="text-white" size={48} />,
      gradient: "from-blue-500 to-purple-600"
    },
    {
      title: "Discover Nearby",
      subtitle: "Map-Based Shopping",
      description: "Find items and sellers near you with our interactive map. See exactly where everything is located on campus.",
      icon: <MapPin className="text-white" size={48} />,
      gradient: "from-green-500 to-blue-500"
    },
    {
      title: "Chat Instantly",
      subtitle: "Real-Time Messaging",
      description: "Connect with buyers and sellers instantly. Negotiate prices, ask questions, and arrange meetups seamlessly.",
      icon: <MessageCircle className="text-white" size={48} />,
      gradient: "from-purple-500 to-pink-500"
    },
    {
      title: "Trade Safely",
      subtitle: "Verified Community",
      description: "All users are verified with student IDs. Meet at safe campus locations with our suggested meeting spots.",
      icon: <Shield className="text-white" size={48} />,
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Nexlify
        </div>
        <Button variant="ghost" onClick={onGetStarted} className="text-gray-600">
          Skip
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="text-center mb-8">
          {/* Icon */}
          <div className={`w-24 h-24 bg-gradient-to-r ${slides[currentSlide].gradient} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
            {slides[currentSlide].icon}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {slides[currentSlide].title}
          </h1>

          {/* Subtitle */}
          <h2 className="text-lg md:text-xl font-medium text-gray-600 mb-4">
            {slides[currentSlide].subtitle}
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 w-8'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="text-gray-600 disabled:opacity-30"
          >
            Previous
          </Button>

          {currentSlide === slides.length - 1 ? (
            <Button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
            >
              Get Started
              <ChevronRight className="ml-2" size={16} />
            </Button>
          ) : (
            <Button
              onClick={nextSlide}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Next
              <ChevronRight className="ml-2" size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Feature Preview */}
      <div className="px-6 pb-6">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="mr-1" size={16} />
              <span>Campus Community</span>
            </div>
            <div className="flex items-center">
              <Zap className="mr-1" size={16} />
              <span>Instant Chat</span>
            </div>
            <div className="flex items-center">
              <Shield className="mr-1" size={16} />
              <span>Safe Trading</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
