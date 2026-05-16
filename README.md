# AtomQuest 1.0 - Goal Setting & Tracking Portal

A premium, full-stack web portal built for the Atomberg Hackathon 1.0. This system enables organizational alignment through structured goal setting, manager approval workflows, and quarterly achievement tracking.

## 🚀 Technology Stack
- **Frontend**: React (Vite), Vanilla CSS (Premium Design System), Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Authentication**: Google OAuth 2.0 with JWT.

## ✨ Core Features
- **Phase 1: Goal Creation & Approval**
    - Dynamic Goal Sheet creation with real-time weightage validation (Total = 100%).
    - Manager Approval Workflow (Approve/Return for Rework).
    - Shared Goals (KPI Push from Manager/Admin).
- **Phase 2: Achievement Tracking**
    - Quarterly window-based achievement logging (Q1-Q4).
    - System-computed progress scores based on UoM types (Numeric, %, Timeline, Zero-based).
- **Admin Governance**
    - Organization-wide completion statistics.
    - User role and hierarchy management.
    - Audit Trail for post-lock changes.

## 🛠️ Setup Instructions

### Prerequisites
- Node.js installed.
- MongoDB instance (local or Atlas).
- Google Cloud Console credentials (for OAuth).

### Backend Setup
1. Navigate to `/backend`.
2. Install dependencies: `npm install`.
3. Create a `.env` file with the following:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   FRONTEND_URL=http://localhost:5173
   CALLBACK_URL=http://localhost:5000/auth/google/callback
   ```
4. Start the server: `npm start`.

### Frontend Setup
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.

## 👤 User Roles
- **Employee**: Create goals, track quarterly progress.
- **Manager**: Review/Approve team goals, provide check-in feedback.
- **Admin**: Configure cycles, oversee organization-wide completion.

## 🎨 Design Philosophy
The portal uses a **"Midnight Precision"** design system:
- **Glassmorphism**: Translucent cards for depth.
- **Vibrant Accents**: Indigo and Pink gradients for a premium feel.
- **Responsive Layout**: Optimized for desktop and tablet views.
- **Micro-animations**: Smooth transitions for better engagement.
