# EventGuard – Event Safety Dashboard

EventGuard is a real-time event safety management system built using the MERN Stack and Socket.IO.
It helps event teams coordinate efficiently through live alerts, incident reporting, staff monitoring, and meeting scheduling.

Built using React, Node.js, Express, MongoDB, and Socket.IO, EventGuard enables seamless communication between Head, Room, and Ground staff, ensuring faster response and improved safety management during events.



## Project Overview

 EventGuard allows event staff to:
- Send and receive real-time alerts
- Report and track incidents
- Monitor staff availability
- Schedule and join coordination meetings
- Manage users through role-based access

The platform focuses on quick communication, efficient coordination, and improved safety management during large-scale events.

## Features

- **Role-based access control**
  - `head`, `room`, `ground` user roles
  - Head dashboard for approvals and higher-level controls
- **Secure authentication**
  - Email/password login and signup
  - Approval flow: new users must be approved by a head
  - JWT-based auth on the backend
- **Real-time alerts**
  - Live alerts using Socket.IO
  - Priority levels: Info / Important / Urgent
  - Optional media attachments (image/video/audio)
 - **Incident Management**
   - Create incidents
   - Upload incident images
   - View incident history
   - Delete incidents
   - Real-time updates across dashboards
- **Staff Directory**
   - View staff grouped by role
   - Online/offline status indicators
   - Status derived from active Socket.IO connections
- **Meeting Scheduler**
   - Head users can schedule meetings
   - Meetings for specific roles or all staff
   - Join meeting links
   - Real-time meeting notifications

## Tech Stack

### Frontend

- React (with Vite)
- React Router
- Material UI (MUI)
- Socket.IO client
- Axios for HTTP requests

### Backend

- Node.js + Express
- MongoDB with Mongoose
- Socket.IO (server)
- JWT auth
- Multer for file uploads (incident/alert media)



## Project Structure

```text
event-safety-backend/
  server.js
  models/
    User.js
    Meeting.js
    ...
  routes/
    auth.js
    ...

event-safety-frontend/
  src/
    App.jsx
    main.jsx
    socket.js
    components/
      Dashboard.jsx
      HeadDashboard.jsx
      StaffInfo.jsx
      Meetings.jsx
      Settings.jsx
      LandingPage.jsx
      Login.jsx
      Signup.jsx
      ForgotPassword.jsx
      ResetPassword.jsx
