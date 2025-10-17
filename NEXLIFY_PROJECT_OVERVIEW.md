# SmartThrift - Local Marketplace & Community Platform

## Project Overview
SmartThrift is a comprehensive local marketplace and community platform built as a Progressive Web App (PWA) that connects neighbors for buying, selling, trading, and socializing within their local area. The platform emphasizes community building, safety, and convenience through features like real-time chat, meetup scheduling, and location-based discovery.

## Technical Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **State Management**: TanStack Query for server state, React Context for theme
- **PWA**: Vite PWA plugin with service workers
- **Maps**: Google Maps integration for location services

### Backend & Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password
- **Storage**: Supabase Storage for images
- **Real-time**: Supabase Realtime for live chat
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Deployment**: Vercel

### Key Dependencies
- `@supabase/supabase-js` - Database and auth
- `@tanstack/react-query` - Server state management
- `react-router-dom` - Client-side routing
- `lucide-react` - Icons
- `@radix-ui/react-*` - UI primitives
- `firebase` - Push notifications

## Core Features

### 1. User Authentication & Profile
- **Sign Up/Sign In**: Email/password authentication via Supabase
- **User Profiles**: Avatar, bio, contact info, verification status
- **Welcome Flow**: First-time user onboarding with feature introduction
- **Password Recovery**: Forgot password functionality

### 2. Marketplace System
- **Create Listings**: Users can post items for sale/trade with:
  - Title, description, price, category
  - Multiple high-quality images
  - Location tagging
  - Condition status (new, used, etc.)
- **Browse & Search**: 
  - Category-based filtering
  - Location-based discovery
  - Search functionality
  - Featured items carousel
- **Listing Management**:
  - Edit/delete own listings
  - Mark as sold/available
  - View listing analytics

### 3. Favorites & Wishlist
- **Save Items**: Users can favorite listings for later
- **Favorites Page**: Organized view of saved items
- **Quick Actions**: Easy access to contact seller

### 4. Real-time Chat System
- **Direct Messaging**: Private conversations between users
- **Chat List**: Overview of all conversations
- **Real-time Updates**: Live message delivery via Supabase Realtime
- **Message History**: Persistent chat storage
- **Chat Notifications**: Real-time message alerts

### 5. Meetup & Social Features
- **Schedule Meetups**: Plan in-person meetings for item exchanges
- **Meetup Calendar**: View scheduled meetups
- **Location Sharing**: Safe meetup spot suggestions
- **Community Events**: Local event discovery and participation

### 6. Location & Discovery
- **Map Integration**: Google Maps for location services
- **Local Discovery**: Find items and users nearby
- **Geofencing**: Location-based notifications
- **Safe Zones**: Suggested meeting locations

### 7. PWA Features
- **Offline Support**: Basic functionality without internet
- **Install Prompt**: Add to home screen capability
- **Push Notifications**: Real-time updates via FCM
- **Responsive Design**: Mobile-first approach
- **App-like Experience**: Native app feel in browser

## Database Schema (Supabase)

### Core Tables
- **users**: Extended user profiles with preferences
- **listings**: Marketplace items with metadata
- **favorites**: User-item relationships
- **chats**: Conversation metadata
- **messages**: Individual chat messages
- **meetups**: Scheduled meetup information
- **categories**: Item categorization system

### Key Features
- **Row Level Security (RLS)**: Data protection
- **Real-time Subscriptions**: Live updates
- **File Storage**: Image uploads with CDN
- **Database Functions**: Server-side logic

## User Experience Flow

### New User Journey
1. **Landing Page**: Hero section with value proposition
2. **Sign Up**: Account creation with email verification
3. **Welcome Tour**: Interactive feature introduction
4. **Profile Setup**: Add avatar, bio, location
5. **First Listing**: Guided item posting process
6. **Discovery**: Browse local items and users

### Existing User Journey
1. **Dashboard**: Personalized home with recommendations
2. **Browse/Search**: Find items by category or location
3. **Item Interaction**: View details, favorite, contact seller
4. **Chat**: Real-time communication with other users
5. **Meetup**: Schedule safe exchanges
6. **Manage**: Update profile, manage listings

## Security & Safety Features

### User Safety
- **Profile Verification**: Identity verification system
- **Safe Meetup Spots**: Suggested public locations
- **Report System**: Flag inappropriate content/users
- **Privacy Controls**: Manage visibility and contact preferences

### Data Security
- **Encrypted Storage**: All data encrypted at rest
- **Secure Authentication**: Supabase Auth with JWT tokens
- **API Security**: Row-level security policies
- **HTTPS Only**: Secure data transmission

## Performance & Optimization

### Frontend
- **Code Splitting**: Lazy loading of routes
- **Image Optimization**: WebP format, lazy loading
- **Caching**: Service worker for offline support
- **Bundle Optimization**: Tree shaking, minification

### Backend
- **Database Indexing**: Optimized queries
- **CDN**: Global content delivery
- **Real-time Efficiency**: Selective subscriptions
- **Image Processing**: Automatic resizing and compression

## Current Implementation Status

### ✅ Completed Features
- User authentication system
- Marketplace listing creation/editing
- Real-time chat functionality
- Favorites system
- Meetup scheduling
- PWA setup with service workers
- Responsive UI with shadcn components
- Location-based discovery
- Push notification setup

### 🔧 Technical Debt & Issues
- **Security**: Service account key exposed in repository
- **Database**: `has_seen_welcome` field mismatch between frontend and migration
- **Storage**: Incorrect delete path for images
- **PWA**: Duplicate service worker files
- **Error Handling**: Inconsistent error states across components

### 🚀 Potential Enhancements
- **Advanced Search**: Filters, sorting, saved searches
- **Rating System**: User and item ratings/reviews
- **Payment Integration**: In-app payment processing
- **Social Features**: User following, activity feeds
- **AI Features**: Smart recommendations, image recognition
- **Analytics**: User behavior tracking, listing performance
- **Moderation**: Automated content filtering
- **Mobile App**: Native iOS/Android versions

## Development Environment

### Setup Requirements
- Node.js 18+
- npm/yarn package manager
- Supabase account and project
- Firebase project for FCM
- Google Maps API key

### Key Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm run lint` - Code linting

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `VITE_FIREBASE_*` - Firebase configuration

## 🚀 Final Year Project Enhancements

### Selected Advanced Features for CSE Final Year

#### 1. AI Recommendation Engine
- **Smart Item Suggestions**: ML-based recommendations for listings based on user behavior, preferences, and browsing history
- **User Matching**: Suggest compatible users for trading based on interests and past interactions
- **Price Optimization**: AI-powered price suggestions based on market trends and item condition
- **Trending Items**: Real-time analysis of popular items in the local area
- **Personalized Feed**: Customized marketplace feed based on user preferences and activity

**Technical Implementation:**
- **Frontend**: TensorFlow.js for client-side ML inference
- **Backend**: Python Flask/FastAPI with scikit-learn or TensorFlow
- **Database**: PostgreSQL with vector extensions for similarity search
- **Caching**: Redis for recommendation caching and real-time updates
- **Data Pipeline**: User behavior tracking and feature engineering

#### 2. Live Video Chat Integration
- **WebRTC Video Calls**: Face-to-face negotiations and item demonstrations
- **Screen Sharing**: Show item details, documents, or other content during calls
- **Recording Capability**: Optional call recording for safety and reference
- **Group Video Calls**: Multi-party video calls for group meetups
- **Mobile Optimization**: Responsive video chat for mobile devices

**Technical Implementation:**
- **WebRTC**: Peer-to-peer video communication
- **Signaling Server**: WebSocket-based signaling for call setup
- **STUN/TURN Servers**: NAT traversal for reliable connections
- **Media Server**: Optional SFU for group calls
- **Mobile SDK**: React Native or Capacitor for native mobile features

#### 3. Conversational AI Assistant (Copilot)
- **Context-Aware Chat**: AI assistant integrated into existing chat system
- **Smart Suggestions**: 
  - "Help me draft a polite counter-offer"
  - "Suggest safe meetup cafés near me"
  - "What's trending in my area?"
  - "How should I price this item?"
- **Natural Language Processing**: Understand user intent and provide relevant assistance
- **Learning Capability**: Improve suggestions based on user feedback and behavior
- **Multi-language Support**: Assist users in their preferred language

**Technical Implementation:**
- **NLP Engine**: OpenAI GPT API or local transformer models
- **Intent Recognition**: Custom training for marketplace-specific intents
- **Context Management**: Maintain conversation context across chat sessions
- **Integration**: Seamless integration with existing chat UI
- **Feedback Loop**: User rating system for continuous improvement

### Implementation Roadmap

#### Phase 1: AI Recommendation Engine (Weeks 1-4)
1. **Data Collection**: Implement user behavior tracking
2. **Model Training**: Develop recommendation algorithms
3. **API Integration**: Create recommendation endpoints
4. **Frontend Integration**: Add recommendation UI components
5. **Testing & Optimization**: A/B testing and performance tuning

#### Phase 2: Live Video Chat (Weeks 5-8)
1. **WebRTC Setup**: Implement peer-to-peer video communication
2. **UI Integration**: Add video chat to existing chat interface
3. **Mobile Optimization**: Ensure responsive design
4. **Security**: Implement call encryption and safety features
5. **Testing**: Cross-browser and device compatibility testing

#### Phase 3: Conversational AI Assistant (Weeks 9-12)
1. **NLP Integration**: Set up language processing capabilities
2. **Intent Training**: Train models for marketplace-specific tasks
3. **Chat Integration**: Seamlessly integrate with existing chat system
4. **Context Management**: Implement conversation memory
5. **User Experience**: Polish UI/UX for AI interactions

### Technical Architecture Enhancements

#### New Dependencies
```json
{
  "@tensorflow/tfjs": "^4.0.0",
  "simple-peer": "^9.11.1",
  "openai": "^4.0.0",
  "redis": "^4.0.0",
  "python-shell": "^5.0.0"
}
```

#### New Database Tables
- **user_behavior**: Track user interactions and preferences
- **recommendations**: Store AI-generated recommendations
- **video_calls**: Video call metadata and recordings
- **ai_conversations**: AI assistant conversation history
- **user_feedback**: AI suggestion feedback and ratings

#### New API Endpoints
- `/api/recommendations` - Get personalized recommendations
- `/api/video/signaling` - WebRTC signaling server
- `/api/ai/chat` - Conversational AI endpoint
- `/api/analytics/behavior` - User behavior tracking
- `/api/trends/items` - Trending items analysis

## Deployment
- **Frontend**: Vercel with automatic deployments
- **Database**: Supabase cloud hosting
- **Storage**: Supabase Storage with CDN
- **Monitoring**: Built-in Supabase analytics
- **AI Services**: Separate Python backend for ML models
- **Video Services**: WebRTC signaling and media servers

---

This document provides a comprehensive overview of the SmartThrift project with planned enhancements for the CSE final year project. The platform will evolve from a basic marketplace to an AI-powered, real-time communication platform that showcases advanced technical skills in machine learning, real-time systems, and conversational AI.
