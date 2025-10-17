import React from 'react';
import { Shield, Zap, Heart, Star, MessageCircle, MapPin } from 'lucide-react';

const AppFeatures = () => {
  const features = [
    {
      icon: MapPin,
      title: "Location-Based Discovery",
      description: "Find items and people near your campus or neighborhood"
    },
    {
      icon: MessageCircle,
      title: "Real-Time Chat",
      description: "Instant messaging to connect buyers and sellers safely"
    },
    {
      icon: Shield,
      title: "Verified Users",
      description: "Student verification and user ratings for trusted transactions"
    },
    {
      icon: Heart,
      title: "Wishlist & Alerts",
      description: "Save items you love and get notified when similar items are posted"
    },
    {
      icon: Star,
      title: "Rating System",
      description: "Rate your experience and build your reputation in the community"
    },
    {
      icon: Zap,
      title: "AI Price Suggestions",
      description: "Smart pricing recommendations based on market data"
    }
  ];

  return (
    <div className="py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Why Choose SmartThrift?
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Built specifically for campus and local community trading with features that matter
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 rounded-lg hover:bg-accent transition-colors">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <feature.icon className="text-primary-foreground" size={24} />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppFeatures;
