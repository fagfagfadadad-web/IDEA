# PupFi - Virtual Pet Care Game

A virtual pet care experience built on MultiversX blockchain with Firebase backend, where players feed and care for their dogs, upgrade their pack, and build a thriving community.

## 🚀 Deployment Status

**Status:** ✅ Production Ready
**Latest Build:** October 9, 2025
**Hosting:** Bolt.new Auto-Deploy

📖 **See [DEPLOY.md](./DEPLOY.md) for full deployment instructions**

## 🎮 Game Features

### Core Gameplay
- **Mining System** - Mine PupFi tokens using different types of dogs
- **Energy System** - Dogs consume energy and regenerate through rest
- **Level System** - Gain experience and levels to increase mining efficiency
- **Pack Management** - Adopt and upgrade different types of dogs

### Dog Types
1. **Zen Puppy** - Starter dog (1000 PupFi starting balance)
   - Mining Power: 10
   - Energy Capacity: 100

2. **Cosmic Retriever** - 1,000 PupFi
   - Mining Power: 25
   - Energy Capacity: 200

3. **Astral Shepherd** - 5,000 PupFi
   - Mining Power: 50
   - Energy Capacity: 300

4. **Divine Wolf** - 20,000 PupFi
   - Mining Power: 100
   - Energy Capacity: 500

### Dog Upgrades
- **Spiritual Power** - Increase PupFi tokens mined per operation
- **Energy Capacity** - Increase maximum energy storage
- **Efficiency** - Reduce energy consumption per operation

### Social Features
- **Referral Program** - Earn 10% of referred players' rewards
- **Quest System** - Complete quests for bonus PupFi tokens
- **Leaderboards** - Compete with other players
- **Admin Panel** - Manage quests, users, and statistics

## 🚀 Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS with custom space theme
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth + MultiversX Wallet
- **Blockchain**: MultiversX Network
- **State Management**: React Context

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 16.20.0+
- Firebase project
- MultiversX wallet

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Firebase Setup**
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Enable Authentication
   - Enable Storage
   - Copy your Firebase config

3. **Environment Variables**
   Update `.env` file with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. **Deploy Firestore Rules**
```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

5. **Initialize Default Data**
   Run the initialization script to add default tasks:
```bash
npm run init-firestore
```

6. **Start Development Server**
```bash
npm run dev
```

## 🎯 Game Mechanics

### Mining
- Dogs mine PupFi tokens every minute
- Energy consumption: 10 energy per mining operation
- Mining rewards scale with dog power and player level
- Random bonus multiplier (1.0x - 1.5x)

### Energy System
- Dogs regenerate 1 energy every 5 minutes
- Energy capacity varies by dog type
- Dogs cannot mine without sufficient energy

### Leveling
- Gain 1 XP per 10 PupFi tokens mined
- Level up every 1,000 XP
- Higher levels increase mining efficiency

### Referral System
- Each player gets a unique referral code
- Referrers earn 10% of referred players' mining rewards
- Tier system with bonus rewards

### Task System
- Daily, mining, social, and referral tasks
- Rewards in PupFi tokens
- Progress tracking and completion rewards

## 🔧 Admin Features

### Admin Panel Access
- Set `isAdmin: true` in user document
- Access admin panel at `/admin`

### Admin Capabilities
- Create, edit, and manage tasks
- View comprehensive game statistics
- Manage users (ban/unban, grant admin privileges)
- Award PupFi tokens to players
- Monitor game economy

## 🎨 Design Features

- **Space Theme** - Dark gradient backgrounds with cosmic elements
- **Orbitron Font** - Futuristic typography for headings
- **Animated Particles** - Interactive background with space particles
- **Responsive Design** - Optimized for mobile and desktop
- **Micro-interactions** - Hover effects and smooth transitions

## 📱 Mobile Optimization

- Touch-friendly interface with 44px minimum touch targets
- Mobile bottom navigation
- Optimized layouts for small screens
- Smooth scrolling and animations

## 🔐 Security

- Firebase Security Rules for data protection
- Row-level security for user data
- Admin-only access to sensitive operations
- Wallet-based authentication

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Environment Setup
- Production Firebase project
- Firestore security rules
- Storage security rules
- Authentication configuration

## 📊 Game Economy

- Starting balance: 1000 PupFi tokens
- Mining rewards: 10-150 PupFi per operation (based on dog and level)
- Dog costs: 0-20,000 PupFi
- Upgrade costs: 100-1,000+ PupFi (exponential scaling)
- Task rewards: 50-500 PupFi

## 🎮 Getting Started

1. Connect your MultiversX wallet
2. Receive starter dog and 1000 PupFi tokens
3. Start mining PupFi tokens
4. Complete tasks for bonus rewards
5. Upgrade dogs and buy new ones
6. Invite friends for referral bonuses
7. Climb the leaderboards!

## 🤝 Contributing

This is a demo application showcasing MultiversX integration with Firebase. Feel free to fork and modify for your own projects.

## 📄 License

GPL-3.0-or-later