# 🎓 AlumSphere - Smart Alumni Reconnect System

A platform connecting alumni with students for mentorship, networking, career opportunities, and community engagement.

---

## 📖 Overview

**AlumSphere** is a Smart Alumni Reconnect System designed to strengthen relationships between alumni, students, and educational institutions. The platform enables mentorship, professional networking, job opportunities, event participation, and career growth through a centralized digital ecosystem.

---

## ✨ Features

### 🔐 User Authentication & Profile Management

* Secure registration and login
* JWT-based authentication
* Role-based access control
* User profile creation and management

### 🎯 Alumni Mentorship Program

* Mentor-mentee matching
* Mentorship session scheduling
* Session management and tracking
* Communication between mentors and students
* AI-powered mentor recommendations

### 📅 Event Management

* Create and manage events
* RSVP and attendance tracking
* Event notifications and reminders
* Alumni engagement activities

### 💼 Job Opportunities

* Job posting system
* Job recommendations
* Career opportunity sharing
* Application tracking

### 🤝 Alumni Networking

* Alumni directory
* Professional networking
* Connection recommendations
* Community engagement

### ⚙️ Admin Dashboard

* User management
* Content moderation
* Event administration
* Platform analytics and monitoring

---

## 🏗️ System Architecture

```text
Frontend (React + Vite)
        │
        ▼
REST APIs / Socket.io
        │
        ▼
Backend (Express + TypeScript)
        │
        ▼
MongoDB Database
```

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Router
* TanStack Query

### Backend

* Express.js
* TypeScript
* MongoDB
* Mongoose
* Firebase Admin SDK
* Socket.io

### Authentication & Security

* JWT (JSON Web Tokens)
* bcrypt

### Email Services

* SendGrid
* Resend

### Additional Tools

* Zod Validation
* Multer File Uploads

---

## 📂 Project Structure

```text
AlumSphere/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── package.json
│
├── shared/
│
├── uploads/
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Before running the project, ensure you have:

* Node.js (v18 or above)
* MongoDB
* Git
* Firebase Project

---

## 📥 Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/alumsphere.git

cd alumsphere
```

---

## ⚡ Frontend Setup

```bash
cd client

npm install

npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

---

## ⚡ Backend Setup

```bash
cd server

npm install

npm run dev
```

Backend will run at:

```text
http://localhost:5000
```

---

## 🔑 Environment Variables

Create a `.env` file inside the backend directory:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

SENDGRID_API_KEY=your_sendgrid_api_key

RESEND_API_KEY=your_resend_api_key

CLIENT_URL=http://localhost:5173
```

---

## 🗄️ MongoDB Configuration

1. Create a MongoDB database.
2. Obtain the connection string.
3. Add the connection string to the `.env` file.
4. Start the backend server.

---

## 🔥 Firebase Configuration

1. Create a Firebase project.
2. Enable required Firebase services.
3. Generate a Firebase Admin SDK key.
4. Add Firebase credentials to the `.env` file.

---

## 📡 Real-Time Features

Powered by Socket.io:

* Real-time notifications
* Live mentorship updates
* Event activity updates
* Instant communication features

---

## 👥 User Roles

### Student

* Search alumni
* Request mentorship
* Attend events
* Apply for jobs

### Alumni

* Mentor students
* Create events
* Post job opportunities
* Expand professional network

### Admin

* Manage users
* Monitor platform activities
* Manage events and content
* View system analytics

---

## 🔮 Future Enhancements

* AI-based job matching
* Advanced analytics dashboard
* Mobile application
* Video mentorship sessions
* Smart networking suggestions

---

## 👨‍💻 Development Team

Developed as a Software Engineering project focused on improving alumni engagement, mentorship, career development, and professional networking.

### Developers:
* Wafi Wahid
* Jaweriya Khan
* Maria Kiran

---

## 📄 License

This project is developed for academic and educational purposes.

---

<div align="center">

**Made with ❤️ to reconnect alumni and empower students.**

</div>
