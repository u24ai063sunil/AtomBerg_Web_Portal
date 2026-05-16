# Implementation Plan: ATOMQUEST Goal Setting & Tracking Portal

## Overview
A functional web-based portal for goal setting, approval, and tracking, designed for Employees, Managers, and Admins.

## Technology Stack
- **Frontend**: React.js (Vite), Vanilla CSS (Premium Design), Lucide Icons, Framer Motion (Animations)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: Google OAuth 2.0 (Passport.js)
- **State Management**: React Context API

## Project Structure
```
/Atomberg_WebPortal
  /backend
    /config
    /controllers
    /models
    /routes
    /middleware
    index.js
  /frontend
    /src
      /components
      /context
      /pages
      /hooks
      /styles
      App.jsx
      main.jsx
```

## Phased Roadmap

### Phase 0: Foundations & Auth
1.  [ ] Setup Backend structure & MongoDB connection.
2.  [ ] Implement Google OAuth 2.0 for SSO.
3.  [ ] Define User Roles (Employee, Manager, Admin).
4.  [ ] Setup Frontend structure with a Premium Design System (CSS Variables, Typography).

### Phase 1: Goal Creation & Approval
1.  [ ] **Employee Portal**:
    - Goal Sheet creation form.
    - Validation: Max 8 goals, Min 10% weightage, Total 100%.
    - UoM selection (Numeric, %, Timeline, Zero).
2.  [ ] **Manager Portal**:
    - Dashboard to review team submissions.
    - Inline editing and approval workflow.
    - Locking mechanism post-approval.
3.  [ ] **Shared Goals**:
    - Functionality to push departmental KPIs.

### Phase 2: Achievement Tracking & Quarterly Check-ins
1.  [ ] **Tracking Interface**:
    - Quarterly window enforcement (May, July, Oct, Jan, March).
    - Actual vs. Planned logging.
2.  [ ] **Manager Check-ins**:
    - Feedback system and discussion logs.
    - Progress score computation based on UoM types.

### Phase 3: Reporting & Governance
1.  [ ] **Admin Dashboard**:
    - Real-time completion rates.
    - Goal unlocking and exception handling.
2.  [ ] **Reporting**:
    - CSV/Excel export for targets vs. actuals.
    - Audit Trail logging for post-lock changes.

### Phase 4: Polish & Extras
1.  [ ] Email/Teams notifications (Bonus).
2.  [ ] Analytics Module (QoQ Trends, Heatmaps) (Bonus).
3.  [ ] UI/UX refinements (Micro-animations, Dark mode).
