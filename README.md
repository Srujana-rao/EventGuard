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
- Communicate directly with other staff members

This project is focused on fast, reliable communication and safety coordination.

## Features

- **Role-based access control**
  - `head`, `room`, and `ground` user roles
  - Head dashboard for account approvals, role change approvals, teams, and meeting management
- **Authentication & account management**
  - Email/password signup and login
  - Google OAuth sign-in
  - Head approval flow for new accounts
- **Real-time alerting**
  - Live alerts using Socket.IO
  - Priority levels: `low`, `medium`, `critical`
  - Target alerts to `all`, `head`, `room`, or `ground`
- **Incident & case management**
  - Automatic incident case creation from alerts
  - Incident reports with assigned teams, status updates, and history
  - Head can assign incidents to teams & assigned teams can move cases to `In Progress` and `Resolved`
- **Team management**
  - Head users can create, update, and delete teams
  - Teams include members and an optional team head
  - Team assignments are used for incident notifications and visibility
- **Real-time chat**
  - Peer-to-peer chat across approved staff
  - Live message delivery and unread message counts
- **Staff directory & presence**
  - View approved staff grouped by role
  - Online/offline presence based on active Socket.IO connections
- **Meeting scheduler**
  - Head users can schedule meetings
  - Target meetings to specific roles or all staff

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
├── event-safety-backend/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── server.js
│   ├── passport.js
│   └── package.json
├── event-safety-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── socket.js
│   ├── public/
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## How It Works

1. A new user signs up and waits for head approval before the account is activated.
2. A Head user approves registrations and can assign roles or approve role-change requests.
3. Approved users log in and connect via Socket.IO.
4. Staff send alerts, optionally attach media, and target specific roles.
5. Head users manage teams, assign incident cases, and schedule meetings.
6. Staff use the dashboard to view live alerts, incident status, team details, meetings, and chat.

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


