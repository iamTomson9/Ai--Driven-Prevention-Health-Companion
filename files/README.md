# HealthConnect — Unified Patient Management Platform

A cross-platform React Native app (Expo) combining remote patient monitoring, predictive analytics, and AI-powered virtual assistance.

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Patient** | Dashboard, Medications, Appointments, AI Chat, Todos |
| **Clinician** | Patient Management, Appointments, Escalated Enquiries, Analytics, Todos |
| **Admin** | User Management (CRUD), AI Analytics, Login History |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native + Expo (cross-platform) |
| Language | TypeScript |
| Backend | Firebase (Auth, Firestore, Storage) |
| AI Chatbot | Botpress (webhook integration) |
| Navigation | React Navigation v6 |
| Icons | @expo/vector-icons (Ionicons) |

---

## 📁 Project Structure

```
src/
├── components/
│   └── common/          # Reusable UI: Button, Card, Input, Badge, etc.
├── constants/
│   └── theme.ts         # Colors, spacing, border radius, shadows
├── hooks/
│   └── useAuth.tsx      # Auth context + hook
├── navigation/
│   └── AppNavigator.tsx # Role-based navigation (Patient/Clinician/Admin tabs)
├── screens/
│   ├── auth/            # LoginScreen, RegisterScreen
│   ├── patient/         # Dashboard, Medications, Appointments, Chat, Todo
│   ├── clinician/       # Patients, Appointments, Enquiries, Analytics, Todo
│   └── admin/           # UserManagement, AIAnalytics, LoginHistory
├── services/
│   ├── firebase.ts      # Firebase initialization
│   ├── authService.ts   # Login, register, logout, profile
│   ├── patientService.ts # Medication logs, appointments, todos
│   ├── clinicianService.ts # Patient management, scheduling, analytics
│   ├── chatService.ts   # Botpress AI integration + escalation
│   └── adminService.ts  # User CRUD, system analytics, login history
└── types/
    └── index.ts         # All TypeScript interfaces
```

---

## 🚀 Setup Instructions

### 1. Clone & Install

```bash
git clone <repo-url>
cd HealthConnect
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore** → Start in production mode
5. Enable **Storage**
6. Get your config from **Project Settings > General > Your apps**
7. Copy `.env.example` to `.env` and fill in your Firebase values

```bash
cp .env.example .env
```

### 3. Deploy Firestore Rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# Replace generated firestore.rules with the one in this project
firebase deploy --only firestore:rules
```

### 4. Botpress Setup

1. Go to [Botpress Cloud](https://app.botpress.cloud)
2. Create a new bot
3. In the bot, go to **Integrations > Webhook**
4. Copy the webhook URL and add to `.env` as `EXPO_PUBLIC_BOTPRESS_WEBHOOK_URL`
5. Train your bot with health-related Q&A
6. The app automatically escalates messages containing emergency keywords

### 5. Run the App

```bash
npx expo start
```

Scan the QR with Expo Go (iOS/Android) or press `a` for Android emulator / `i` for iOS simulator.

---

## 🔥 Firebase Collections

| Collection | Description |
|------------|-------------|
| `users` | All users (base profile) |
| `patients` | Extended patient profiles with medications/diagnoses |
| `clinicians` | Clinician profiles with patient lists |
| `medicationLogs` | Daily medication intake records |
| `appointments` | Scheduled appointments (physical/virtual) |
| `chatMessages` | AI chat history |
| `escalatedEnquiries` | AI-escalated patient enquiries for clinicians |
| `todos` | Todo items for patients and clinicians |
| `loginHistory` | User login audit log |

---

## 🤖 AI Escalation Logic

The AI chat automatically escalates conversations to the assigned clinician when it detects these keywords:

```
emergency, chest pain, can't breathe, shortness of breath,
severe pain, allergic reaction, overdose, suicidal, urgent,
bleeding, unconscious, seizure, stroke, heart attack
```

Escalated enquiries appear in the clinician's **Enquiries** tab with full conversation history.

---

## 📊 Features by Role

### Patient
- ✅ View dashboard with today's medication overview
- ✅ Mark medications as taken/skipped with notes
- ✅ View medication history with adherence tracking  
- ✅ View upcoming & past appointments with venue/meeting details
- ✅ Chat with AI assistant (Botpress)
- ✅ Emergency escalation to clinician
- ✅ Personal health todo list

### Clinician
- ✅ View and search assigned patients
- ✅ Set patient diagnoses (add/remove tags)
- ✅ Prescribe medications with times and dosage
- ✅ Schedule physical and virtual appointments
- ✅ View and resolve escalated AI enquiries with notes
- ✅ View per-patient medication adherence analytics
- ✅ Personal todo list

### Admin
- ✅ Create, activate, deactivate user accounts
- ✅ Filter users by role
- ✅ View AI usage analytics (conversations, escalation rate, keywords)
- ✅ View system-wide medication adherence stats
- ✅ View full login history with role filtering

---

## 🔧 Extending the App

### Adding Video Calls
Integrate [LiveKit](https://livekit.io) or [Agora](https://agora.io) SDK:
```bash
npm install @livekit/react-native-webrtc
```
Create `src/services/videoService.ts` and add a VideoCall screen.

### Push Notifications (Medication Reminders)
```bash
npx expo install expo-notifications
```
Use `expo-notifications` to schedule local notifications based on medication times.

### Training Botpress
In Botpress, add Q&A training data for:
- Medication side effects and interactions
- Appointment management queries
- General health FAQs
- Escalation triggers for emergency keywords

---

## 📱 Build for Production

```bash
# Install EAS CLI
npm install -g eas-cli
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS  
eas build --platform ios
```
