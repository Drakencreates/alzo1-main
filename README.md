# Alzo

Alzo is a caregiver, doctor, and patient management portal built with Express.js and static HTML pages. It supports role-based dashboards, patient monitoring, appointments, medical records, SOS alerts, medication tracking, and cognitive games for patients.

## Features

- User signup, login, and role selection for patients, caregivers, and doctors
- Patient dashboard with medications, appointments, medical records, SOS alerts, videos, and games
- Caregiver dashboard for managing assigned patients and sending SOS alerts
- Doctor dashboard for viewing patients, appointments, SOS alerts, records, videos, and medication plans
- JWT-based authentication
- MongoDB Atlas support with local MongoDB and embedded local-store fallback
- Realtime notifications using Pusher
- Medical record image support with Cloudinary
- Deployment configuration for Vercel, Netlify, and Render

## Tech Stack

- Node.js
- Express.js
- MongoDB and Mongoose
- JSON Web Tokens
- Pusher
- Cloudinary
- Static HTML, CSS, and JavaScript

## Project Structure

```text
.
├── backend/              # Express server, routes, models, and config
├── api/                  # Serverless API entry point
├── caregiver/            # Caregiver pages
├── doctor/               # Doctor pages
├── patient/              # Patient pages and cognitive games
├── netlify/              # Netlify function entry point
├── land1.html            # Landing page
├── login.html            # Login page
├── signup.html           # Signup page
├── role.html             # Role selection page
└── package.json          # Root scripts and dependencies
```

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB Atlas URI or a local MongoDB instance

The app can also fall back to a zero-config local datastore if MongoDB is not available.

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root or inside `backend/` using `.env.example` as a template.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Run Locally

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:5000
```

## Main Routes

- `/` - Landing page
- `/signup` - User registration
- `/login` - User login
- `/role` - Role selection
- `/patient/pat.html` - Patient dashboard
- `/caregiver/care.html` - Caregiver dashboard
- `/doctor/doc.html` - Doctor dashboard

## API Overview

Most API routes are served under:

```text
/api/auth
```

Core API areas include authentication, user profiles, caregiver-patient linking, appointments, medications, SOS alerts, videos, patient games, and medical records.

## Deployment

This project includes deployment files for:

- Vercel: `vercel.json`
- Netlify: `netlify.toml` and `netlify/functions/server.js`
- Render: `render.yaml`

Set the required environment variables in your hosting provider before deploying.

## License

ISC
