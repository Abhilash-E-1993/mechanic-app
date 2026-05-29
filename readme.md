# GarageGo

GarageGo is a full-stack roadside assistance web app that connects vehicle owners with nearby mechanics. Customers can raise a breakdown request, get matched with an available mechanic in their selected area, receive live status updates, and complete the service through OTP verification.

The project combines a React + Vite frontend, Firebase Authentication, Cloud Firestore, Firebase Cloud Messaging, and an Express backend for protected notification delivery and request fallback handling.

## Highlights

- Role-based experience for customers and mechanics
- Firebase email/password and Google authentication
- Customer onboarding and mechanic profile setup
- Area-based mechanic discovery with ETA and distance ranking
- Realtime service request updates with Firestore listeners
- Push notifications using Firebase Cloud Messaging
- Backend-protected notification routes with Firebase ID token verification
- Mechanic accept/reject workflow with automatic queue fallback
- Map-based request view using Leaflet and React Leaflet
- OTP-based service completion
- Optional Twilio-powered reminder call flow for unanswered requests

## Tech Stack

### Frontend

- React 18
- Vite 5
- React Router DOM
- Firebase Web SDK
- Cloud Firestore
- Firebase Cloud Messaging
- Leaflet and React Leaflet
- Tailwind CSS with custom app styling

### Backend

- Node.js
- Express
- Firebase Admin SDK
- CORS
- dotenv
- Twilio REST API integration through server-side fetch

## How It Works

1. A customer signs in and creates a breakdown request.
2. GarageGo finds available mechanics in the selected city and area.
3. Mechanics are ranked using estimated distance and ETA.
4. The request is assigned to the best matched mechanic.
5. The backend sends a push notification to the assigned mechanic.
6. The mechanic can accept or reject the job.
7. If rejected or unanswered, the request can move to the next mechanic in the queue.
8. After service completion, the mechanic verifies the customer-visible OTP and closes the request.

## User Roles

### Customer

Customers can:

- sign up or log in
- complete onboarding
- choose city and service area
- find nearby available mechanics
- create breakdown requests
- track request status
- call the assigned mechanic
- share the completion OTP

### Mechanic

Mechanics can:

- sign up or log in
- add garage and service details
- set city, service area, phone number, and services offered
- receive incoming request notifications
- accept or reject jobs
- view customer location on a map
- open navigation to the customer
- verify OTP and complete the service

## Project Structure

```text
mechanic-app/
  src/
    components/
    constants/
    context/
    pages/
    services/
    utils/
  public/
  firebase/
  server/
    src/
      middleware/
      routes/
      services/
  README.md
```

## Key Folders

- `src/pages` - main customer, mechanic, auth, and onboarding screens
- `src/components` - reusable UI such as request cards, maps, navbar, and push manager
- `src/context` - authentication and user profile state
- `src/services` - Firestore and notification API helpers
- `src/utils` - ETA, location, routing, and tracking helpers
- `server/src` - Express backend, Firebase Admin setup, notification routes, and fallback services
- `firebase` - Firestore security rules

## API Overview

Backend base URL:

```text
http://localhost:4000
```

Notification routes require:

```text
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

Main endpoints:

- `GET /api/health` - backend health check
- `POST /api/notifications/request-created` - notify the assigned mechanic
- `POST /api/notifications/request-accepted` - notify the customer and cancel fallback handling
- `POST /api/notifications/request-declined` - move the request to the next mechanic when possible

## Environment Variables

Create a frontend `.env` file in the project root:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_NOTIFICATION_API_BASE_URL=http://localhost:4000
```

Create a backend `.env` file inside `server/`:

```bash
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
CLIENT_APP_URL=http://localhost:5173
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
NOTIFICATION_ICON_URL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_TWIML_URL=
TWILIO_STATUS_CALLBACK_URL=
TWILIO_FALLBACK_DELAY_MS=60000
TWILIO_TIMEOUT_SECONDS=25
```

Twilio variables are optional. Push notifications and request routing still work without them, but reminder calls remain disabled.

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Firebase project
- Firebase Authentication enabled
- Cloud Firestore enabled
- Firebase Cloud Messaging enabled

### Install dependencies

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

### Run the app

Start the frontend:

```bash
npm run dev
```

Start the backend:

```bash
npm run dev:server
```

Frontend runs on:

```text
http://localhost:5173
```

Backend runs on:

```text
http://localhost:4000
```

## Available Scripts

```bash
npm run dev          # start Vite frontend
npm run dev:client   # start Vite frontend
npm run dev:server   # start Express backend
npm run build        # build frontend
npm run preview      # preview production build
npm run lint         # run ESLint
npm run start:server # start backend without watch mode
```

## Firebase Setup

1. Create a Firebase project.
2. Add a Firebase web app.
3. Enable Email/Password authentication.
4. Enable Google authentication if needed.
5. Create a Cloud Firestore database.
6. Enable Firebase Cloud Messaging.
7. Generate a Web Push certificate and add the VAPID key to `.env`.
8. Create a Firebase service account for the backend.
9. Add the Firebase Admin credentials to `server/.env`.
10. Apply the Firestore rules from `firebase/firestore.rules`.

## Current Notes

- Mechanic discovery depends on Firestore read rules for mechanic profiles. Review the rules before production deployment.
- Location tracking is demo-oriented and uses deterministic/simulated mechanic movement rather than live GPS streaming.
- There is no automated test suite configured yet.
- The app currently uses Indian city, area, and phone-number assumptions.

## Future Improvements

- Add automated tests for request routing, notifications, and OTP completion
- Add admin review and mechanic verification
- Add customer cancellation flow
- Add a mechanic availability toggle
- Replace simulated tracking with live mechanic location updates
- Add `.env.example` files for safer setup sharing
- Add CI for linting and production builds

## Summary

GarageGo is a practical MVP for roadside assistance workflows. It covers the core journey from customer request creation to mechanic assignment, realtime status updates, push notifications, fallback handling, and OTP-based completion.
