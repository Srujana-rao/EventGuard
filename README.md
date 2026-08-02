# EventGuard – Event Safety Dashboard

EventGuard is a real-time event safety management system for live event teams. It combines role-based coordination, urgent alerting, incident tracking, team assignments, meeting scheduling, and live chat into a single dashboard.

Built with React, Vite, Node.js, Express, MongoDB, and Socket.IO, EventGuard helps Head, Room, and Ground staff coordinate faster and stay aware of safety events as they unfold.

## Project Overview

EventGuard is designed for event safety operations and lets staff:
- Register, sign in, and join the event platform with role-based access
- Send live alerts with attachments and role targeting
- Track and manage incident cases automatically created from alerts
- Approve users and manage role-change requests through Head control
- Manage teams, assign incidents, and monitor staff status
- Coordinate meetings with role-specific invitations and live notifications
- Chat directly with other approved staff members

This project is focused on fast, reliable communication and safety coordination.

## Features

- **Role-based access control**
  - `head`, `room`, and `ground` user roles
  - Head dashboard for account approvals, role change approvals, teams, and meeting management
- **Authentication & account management**
  - Email/password signup and login
  - Google OAuth sign-in
  - Head approval flow for new accounts
  - Forgot password and password reset via email
  - Account deletion
- **Real-time alerting**
  - Live alerts using Socket.IO
  - Priority levels: `low`, `medium`, `critical`
  - Target alerts to `all`, `head`, `room`, or `ground`
  - Optional media attachments (image, video, audio)
  - Alert deletion by owner
- **Incident & case management**
  - Automatic incident case creation from alerts
  - Incident reports with assigned teams, status updates, and history
  - Head can assign incidents to teams
  - Assigned teams can move cases to `In Progress` and `Resolved`
- **Team management**
  - Head users can create, update, and delete teams
  - Teams include members and an optional team head
  - Team assignments are used for incident notifications and visibility
- **Working day / event coordination**
  - Head users can set the active working date and event name
  - Alerts and incidents are associated with the current working day
- **Real-time chat**
  - Peer-to-peer chat across approved staff
  - Live message delivery and unread message counts
- **Staff directory & presence**
  - View approved staff grouped by role
  - Online/offline presence based on active Socket.IO connections
- **Meeting scheduler**
  - Head users can schedule meetings
  - Target meetings to specific roles or all staff
  - Join meeting links and receive live meeting notifications

## Tech Stack

### Frontend
- React
- Vite
- React Router DOM
- Material UI (MUI)
- Socket.IO client
- Axios

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- Socket.IO server
- JWT authentication
- Passport + Google OAuth
- Multer file uploads for alert media
- Nodemailer for password reset emails

## Project Structure

```text
EventGuard/
  event-safety-backend/
    server.js
    passport.js
    .env
    package.json
    uploads/
    models/
      Counter.js
      Meeting.js
      Message.js
      SafetyIncident.js
      Team.js
      User.js
      WorkingDay.js
    routes/
      auth.js
  event-safety-frontend/
    package.json
    vite.config.js
    index.html
    src/
      App.jsx
      main.jsx
      socket.js
      ThemeModeContext.jsx
      App.css
      index.css
      assets/
      components/
        ChangePassword.jsx
        Chat.jsx
        Dashboard.jsx
        DashboardShell.jsx
        ForgotPassword.jsx
        HeadDashboard.jsx
        Incidents.jsx
        LandingPage.jsx
        Login.jsx
        Meetings.jsx
        PendingApproval.jsx
        ResetPassword.jsx
        Settings.jsx
        SidebarMenu.jsx
        Signup.jsx
        SocialSuccess.jsx
        StaffInfo.jsx
        Teams.jsx
    public/
```

## How It Works

1. A new user signs up and is created as `ground` with approval pending.
2. A Head user approves registrations and can assign roles or approve role-change requests.
3. Approved users log in and connect via Socket.IO.
4. Staff send alerts, optionally attach media, and target specific roles.
5. The backend persists alerts and auto-creates incident cases for safety tracking.
6. Head users manage teams, assign incident cases, and schedule meetings.
7. Staff use the dashboard to view live alerts, incident status, team details, meetings, and chat.

## Setup Instructions

### Prerequisites
- Node.js (LTS)
- npm or yarn
- MongoDB instance (local or Atlas)

### 1. Clone the Repository
```bash
git clone https://github.com/Srujana-rao/EventGuard.git
cd EventGuard
```

### 2. Backend Setup
```bash
cd event-safety-backend
npm install
```
Create a `.env` file in `event-safety-backend`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```
Run backend:
```bash
npm start
```
Backend will run on:
```bash
http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../event-safety-frontend
npm install
npm run dev
```
Frontend will run on:
```bash
http://localhost:5173
```

## Notes
- Ensure `MONGO_URI` points to a valid MongoDB instance.
- Password reset email requires valid `EMAIL_USER` and `EMAIL_PASS` credentials.
- Socket.IO requires the frontend and backend to run simultaneously for live updates.
