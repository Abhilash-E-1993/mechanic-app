# GarageGo

GarageGo is a full-stack roadside assistance web application built to connect stranded vehicle owners with nearby mechanics. The project uses a React + Vite frontend for the customer and mechanic experience, Firebase for authentication, Firestore for realtime data storage, Firebase Cloud Messaging for web push notifications, and an Express backend for protected notification delivery and fallback reminder workflows.

This project is designed around a simple real-world use case:

- A customer signs in and raises a breakdown request.
- The system finds the nearest available mechanic in the selected city/area.
- The mechanic receives a push notification and can accept or reject the job.
- If the mechanic rejects or does not respond in time, the request can move to the next mechanic in the queue.
- Once accepted, the customer can track progress and the mechanic can complete the job using OTP verification.

## Project Goals

- Help customers get roadside assistance quickly.
- Give mechanics a focused dashboard for managing incoming requests.
- Support area-based mechanic discovery with ETA and distance ranking.
- Provide realtime request visibility using Firestore snapshots.
- Improve response reliability with browser push notifications and backend-triggered delivery.
- Add a fallback reminder-call flow for unanswered requests.

## Tech Stack

### Frontend

- React 18
- Vite 5
- React Router DOM
- Firebase Web SDK
- Firestore
- Firebase Cloud Messaging
- Leaflet + React Leaflet
- Tailwind CSS v4 import style with custom CSS theming

### Backend

- Node.js
- Express
- Firebase Admin SDK
- CORS
- dotenv

### Platform Services

- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Messaging
- Twilio Voice API for optional fallback reminder calls

## High-Level Architecture

The application is split into two main parts:

1. Frontend app
   The frontend handles authentication, onboarding, customer and mechanic dashboards, request creation, request updates, OTP completion, map rendering, FCM token registration, and foreground notification UI.

2. Backend notification service
   The Express backend verifies Firebase ID tokens, receives trusted notification events from the frontend, sends push notifications with Firebase Admin, schedules fallback reminder calls, and can re-route pending requests to the next mechanic when needed.

### Why a separate backend exists

Instead of sending notifications directly from the client, the app sends authenticated requests to the Express backend. This helps centralize:

- Firebase Admin messaging access
- notification security
- fallback reminder call scheduling
- routing changes when mechanics reject or ignore requests
- environment-specific notification behavior

## Core User Roles

### Customer

A customer can:

- sign up or log in
- complete onboarding
- choose a city and area
- view available mechanics
- create a breakdown request
- receive notification updates
- track assigned mechanic progress
- call the mechanic directly
- share a completion OTP with the mechanic

### Mechanic

A mechanic can:

- sign up or log in
- complete onboarding with garage and service details
- define city and service area
- mark supported service types
- receive assigned requests
- accept or reject a request
- view customer location on a map
- launch external navigation to the customer
- generate and verify completion OTP

## Main Product Flow

### 1. Authentication and onboarding

Authentication is handled through Firebase Auth with:

- email/password login
- Google sign-in

After sign-up or first Google login, the app creates a Firestore user profile. If the user has not chosen a role yet, they are taken to the role selection page.

Files involved:

- [src/context/AuthContext.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/context/AuthContext.jsx)
- [src/pages/LoginPage.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/pages/LoginPage.jsx)
- [src/pages/SignupPage.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/pages/SignupPage.jsx)
- [src/pages/RoleSelectionPage.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/pages/RoleSelectionPage.jsx)

### 2. Role setup

The onboarding page supports two roles:

- `customer`
- `mechanic`

For mechanics, the app stores:

- city
- service area
- garage name
- phone number
- years of experience
- services offered
- availability status
- deterministic base location

For customers, mechanic-specific fields are cleared.

### 3. Customer searches for mechanics

On the customer dashboard, the user selects a city and area. The frontend then:

- queries available mechanics in the selected area
- optionally captures the customer’s current GPS location
- ranks mechanics by estimated travel distance and ETA

Files involved:

- [src/pages/CustomerDashboard.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/pages/CustomerDashboard.jsx)
- [src/services/firestoreService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/services/firestoreService.js)
- [src/utils/mechanicRoutingService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/utils/mechanicRoutingService.js)
- [src/utils/etaService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/utils/etaService.js)

### 4. Request creation

When the customer confirms a service request:

- the app checks that there is no conflicting active request
- the customer location is captured if available
- the nearest eligible mechanic is selected
- a routing queue of ranked mechanics is generated
- a `serviceRequests` document is created with status `Pending`
- the backend is called to notify the assigned mechanic

### 5. Notification and fallback flow

When a request is created:

- the frontend calls `POST /api/notifications/request-created`
- the backend verifies the Firebase ID token
- the backend sends an FCM push notification to the mechanic
- the backend schedules an optional fallback reminder call

If the mechanic accepts:

- the frontend updates Firestore
- the frontend calls `POST /api/notifications/request-accepted`
- the backend cancels the pending fallback call
- the backend notifies the customer

If the mechanic rejects:

- the frontend calls `POST /api/notifications/request-declined`
- the backend advances the request to the next mechanic in the queue
- the next mechanic receives a fresh push notification
- a new fallback reminder schedule is created

### 6. Request acceptance and live service state

When a mechanic accepts:

- the request status becomes `Accepted`
- mechanic availability becomes `busy`
- a mechanic area/base location is attached to the request
- the customer sees the accepted service in their request list
- the customer can view simulated route progress on the map
- the mechanic can open navigation to the customer

### 7. OTP-based completion

To close an accepted request:

- the mechanic generates a 4-digit completion OTP
- the customer sees the OTP in their request card
- the customer shares it with the mechanic
- the mechanic enters the OTP
- the request is marked `Completed`
- the mechanic returns to `available`

This prevents accidental request closure and adds a simple completion handshake.

## Frontend Structure

### Application entry

- [src/main.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/main.jsx)
- [src/App.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/App.jsx)

The app uses `BrowserRouter` and an `AuthProvider`. The home route dynamically chooses what to show based on:

- authentication state
- profile loading state
- role assignment

### Important frontend modules

- [src/context/AuthContext.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/context/AuthContext.jsx)
  Manages auth state, profile caching, sign-in, sign-up, Google login, logout, and profile refresh.

- [src/services/firestoreService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/services/firestoreService.js)
  Encapsulates reads/writes for users, requests, OTPs, availability, and customer subscriptions.

- [src/services/notificationService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/services/notificationService.js)
  Sends authenticated requests from the client to the Express backend for trusted notification actions.

- [src/components/PushNotificationManager.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/components/PushNotificationManager.jsx)
  Handles notification permission prompts, FCM token sync, foreground message listeners, and in-app toasts.

- [src/components/RequestList.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/components/RequestList.jsx)
  Shared request UI for customer and mechanic flows, including action buttons and OTP UI.

- [src/components/LocationMap.jsx](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/components/LocationMap.jsx)
  Displays customer/mechanic locations and simulates route progress for the accepted request experience.

### UI and styling

The frontend uses a dark visual theme with custom CSS variables and a branded amber color system. Typography is based on `Syne` for headings and `DM Sans` for body copy.

Main style file:

- [src/index.css](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/index.css)

## Backend Structure

### Backend entry

- [server/src/index.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/server/src/index.js)

Responsibilities:

- load environment variables
- configure CORS
- expose health endpoint
- authenticate protected notification routes
- start fallback reminder recovery loop
- log backend startup configuration

### Important backend modules

- [server/src/middleware/authMiddleware.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/server/src/middleware/authMiddleware.js)
  Verifies Firebase ID tokens from the client and attaches `req.user`.

- [server/src/routes/notificationRoutes.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/server/src/routes/notificationRoutes.js)
  Defines notification API endpoints for request creation, acceptance, and decline/reroute.

- [server/src/services/notificationService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/server/src/services/notificationService.js)
  Loads request/user data and sends push notifications using Firebase Admin messaging.

- [server/src/services/requestRoutingService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/server/src/services/requestRoutingService.js)
  Moves a pending request to the next mechanic in the ranked queue.

- [server/src/services/fallbackCallScheduler.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/server/src/services/fallbackCallScheduler.js)
  Schedules and recovers fallback reminder calls for pending requests.

- [server/src/services/twilioService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/server/src/services/twilioService.js)
  Triggers Twilio voice reminder calls when configured.

- [server/src/firebaseAdmin.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/server/src/firebaseAdmin.js)
  Initializes Firebase Admin SDK from environment variables.

## Data Model

The project currently uses two main Firestore collections.

### `users`

Each user document is keyed by Firebase Auth UID.

Common fields:

- `name`
- `email`
- `role`
- `createdAt`
- `updatedAt`
- `fcmToken`
- `fcmTokens`

Mechanic-specific fields:

- `city`
- `serviceArea`
- `garageName`
- `phoneNumber`
- `experienceYears`
- `services`
- `availabilityStatus`
- `mechanicBaseLocation`
- `latitude`
- `longitude`

### `serviceRequests`

Important fields used by the app:

- `customerId`
- `customerName`
- `mechanicId`
- `mechanicName`
- `garageName`
- `mechanicPhoneNumber`
- `mechanicCity`
- `mechanicServiceArea`
- `assignedMechanicLocation`
- `mechanicLocation`
- `customerLocation`
- `serviceType`
- `city`
- `area`
- `status`
- `completionOTP`
- `otpGeneratedAt`
- `mechanicRoutingQueue`
- `mechanicRoutingIndex`
- `matchedMechanicCount`
- `currentMechanicEtaMinutes`
- `currentMechanicDistanceKm`
- `fallbackCallStatus`
- `fallbackCallScheduledFor`
- `fallbackCallAttemptCount`
- `createdAt`
- `updatedAt`

## API Documentation

Base backend URL:

- Local: `http://localhost:4000`
- Configured by frontend env: `VITE_NOTIFICATION_API_BASE_URL`

All notification endpoints require:

- `Authorization: Bearer <firebase-id-token>`
- `Content-Type: application/json`

### `GET /api/health`

Health check endpoint.

Example response:

```json
{
  "ok": true,
  "service": "notification-backend"
}
```

### `POST /api/notifications/request-created`

Used after a customer creates a service request.

Request body:

```json
{
  "requestId": "firestore-request-id"
}
```

Behavior:

- confirms the caller is the customer who owns the request
- sends push notification to the assigned mechanic
- schedules fallback reminder logic

### `POST /api/notifications/request-accepted`

Used after the mechanic accepts a request.

Behavior:

- confirms the caller is the assigned mechanic
- cancels the scheduled fallback call
- sends acceptance notification to the customer

### `POST /api/notifications/request-declined`

Used after the mechanic rejects a request.

Behavior:

- confirms the caller is the assigned mechanic
- moves the request to the next mechanic if one exists
- sends push notification to the next mechanic
- schedules a new fallback call for the reassigned request

## Notifications

### Browser push notifications

Push notifications are implemented using Firebase Cloud Messaging.

Frontend responsibilities:

- ask the user for notification permission
- register the service worker
- generate/store the device FCM token
- listen for foreground messages
- show browser notification or in-app toast

Relevant files:

- [src/fcm.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/fcm.js)
- [public/firebase-messaging-sw.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/public/firebase-messaging-sw.js)

Backend responsibilities:

- collect user tokens
- send push notification payloads
- remove invalid tokens after failed delivery

### Notification click behavior

The service worker opens the app and routes the user back into the main application. Since the home route is role-aware, the user is naturally taken to the right dashboard after sign-in.

## Location, ETA, and Routing Logic

This project uses a mix of actual and deterministic demo coordinates.

### How it works

- some Bengaluru areas have explicit coordinates
- other supported cities use seeded demo coordinates around city centers
- mechanic base positions are generated deterministically from city, area, and mechanic ID
- ETA is estimated using geographic distance and average speed assumptions
- accepted requests can show a simulated mechanic journey on the map

This makes the app demo-friendly even without live mechanic GPS tracking infrastructure.

Relevant files:

- [src/utils/etaService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/utils/etaService.js)
- [src/utils/mechanicLocationService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/utils/mechanicLocationService.js)
- [src/utils/mechanicRoutingService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/utils/mechanicRoutingService.js)
- [src/utils/mechanicTrackingService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/utils/mechanicTrackingService.js)

## Security Model

### Frontend authentication

Users authenticate with Firebase Auth. The frontend uses the active user session and sends ID tokens to the backend for protected operations.

### Backend authentication

The Express backend verifies Firebase ID tokens using Firebase Admin. Only valid signed-in users can call protected notification routes.

### Firestore rules

Rules are stored in:

- [firebase/firestore.rules](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/firebase/firestore.rules)
- [firestore.rules](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/firestore.rules)

Current rule intent:

- users can read and update their own profile
- customers can create their own service requests
- only request participants can read a request
- only the assigned mechanic can update the request

## Environment Variables

The project currently uses real `.env` files in the repo workspace, but for sharing or deployment you should create your own environment files.

### Frontend `.env`

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

### Backend `server/.env`

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

### Notes

- `VITE_FIREBASE_VAPID_KEY` is required for browser push token generation.
- `VITE_NOTIFICATION_API_BASE_URL` should point to the deployed Express backend.
- `CLIENT_ORIGIN` controls backend CORS and supports comma-separated origins.
- `CLIENT_APP_URL` is used when building notification click links.
- `FIREBASE_ADMIN_PRIVATE_KEY` must preserve line breaks correctly, usually by storing `\n` in the env value.
- Twilio variables are optional. If missing, the push flow still works and reminder calls remain disabled.
- `TWILIO_FALLBACK_DELAY_MS` has a hard minimum of `60000` ms to avoid rapid auto-handoff.

## Local Development Setup

### Prerequisites

- Node.js 18+ recommended
- npm
- Firebase project
- Firestore database
- Firebase Auth enabled
- Firebase Cloud Messaging enabled

### Install dependencies

From the project root:

```bash
npm install
```

Install backend dependencies:

```bash
cd server
npm install
```

### Run the app

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm run dev:server
```

### Available scripts

Root `package.json`:

- `npm run dev`
- `npm run dev:client`
- `npm run dev:server`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run start:server`

Backend `server/package.json`:

- `npm run dev`
- `npm run start`

## Firebase Setup Checklist

1. Create a Firebase project.
2. Add a Firebase web app.
3. Enable Authentication providers:
   Email/Password and optionally Google.
4. Create Firestore.
5. Apply Firestore rules from `firebase/firestore.rules`.
6. Enable Firebase Cloud Messaging.
7. Generate a Web Push certificate and copy the VAPID public key into frontend env.
8. Create a Firebase service account for the backend.
9. Fill backend Firebase Admin environment variables.

## Deployment Notes

### Frontend

The frontend can be deployed to any static host that supports Vite output, such as Firebase Hosting, Vercel, Netlify, or similar platforms.

### Backend

The backend can be deployed separately to platforms like Railway, Render, or any Node-compatible server environment.

### Deployment configuration reminders

- deploy frontend and backend separately
- point `VITE_NOTIFICATION_API_BASE_URL` to the deployed backend
- point `CLIENT_APP_URL` to the deployed frontend
- add the frontend origin to `CLIENT_ORIGIN`
- ensure Firebase service account env variables are present on the backend

## Current Strengths

- clear role-based flow for customers and mechanics
- clean separation between UI app and secure notification backend
- realtime customer request subscription
- ranked mechanic assignment with queue fallback
- OTP-based completion flow
- integrated map and ETA experience
- browser push notification support
- optional Twilio reminder workflow

## Current Limitations and Caveats

This section documents the current implementation honestly so the README can also act as a project review summary.

### 1. Firestore rules currently conflict with mechanic discovery

The frontend queries mechanic profiles from the `users` collection, but the current Firestore rules only allow a user to read their own `users/{uid}` document. In production, that would block customers from reading available mechanics unless the rules are adjusted.

Affected files:

- [src/services/firestoreService.js](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/src/services/firestoreService.js)
- [firebase/firestore.rules](/c:/Users/abhil/OneDrive/Desktop/web%20dev/mechanic-app/mechanic-app/firebase/firestore.rules)

### 2. Location tracking is demo/simulated, not live mechanic GPS

The accepted request tracking experience uses deterministic route simulation rather than actual mechanic device movement. This is good for demos, but not a full production live-tracking system.

### 3. No automated test suite is currently configured

There is no `test` script in either `package.json`, so verification currently depends on manual testing and builds.

### 4. Environment example files are not currently committed

The existing README referenced `.env.example` files, but they are not present in the project tree right now. This README includes the required variables directly to make setup easier.

### 5. Some UX and copy are tuned for Indian market assumptions

The app assumes:

- Indian city/area lists
- `+91` phone formatting
- 10-digit local phone validation

That is appropriate for the current scope, but would need abstraction for multi-country rollout.

## Suggested Next Improvements

- fix Firestore rules to support safe public mechanic discovery
- add automated tests for auth, routing, and notification flows
- add admin tooling for mechanic verification and moderation
- replace simulated tracking with live mechanic location updates
- store request audit history for better troubleshooting
- add customer cancellation flow
- add mechanic availability toggle in UI
- create `.env.example` files for frontend and backend
- add CI build/lint pipeline

## Repository Map

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

## Summary

GarageGo is a good foundation for a smart roadside assistance platform. The project already contains the major building blocks of a usable MVP:

- role-based onboarding
- mechanic discovery
- request lifecycle management
- notifications
- fallback escalation
- OTP completion
- map-based service visibility

It is especially strong as a portfolio or prototype project because it demonstrates both product thinking and full-stack integration across frontend UI, Firebase, backend APIs, notifications, and workflow automation.
