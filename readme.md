# Vehicle Breakdown Assistance Web App

A beginner-friendly mini-project built with **React + Vite + Tailwind CSS + Firebase**.

## Features

- Email/password and Google login
- Role-based profiles (Customer / Mechanic)
- Area-based mechanic matching (no GPS)
- Customers can send service requests
- Mechanics can Accept / Reject / Complete requests
- Request status tracking for customers

## Tech Stack

- React (Vite)
- Tailwind CSS
- Firebase Authentication
- Firebase Firestore

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and add your Firebase values.
3. Start development server:
   ```bash
   npm run dev
   ```

## Firebase Setup

1. Create a Firebase project.
2. Enable **Authentication**:
   - Email/Password
   - Google sign-in
3. Create Firestore database in test mode.
4. Add web app config values to `.env`.
5. (Recommended) Apply `firestore.rules` in Firebase console.

## Data Model (Simple)

### `users` collection
- `name`, `email`, `role`
- `serviceArea`
- mechanic-only: `garageName`, `experienceYears`, `services[]`, `availabilityStatus`

### `serviceRequests` collection
- `customerId`, `customerName`
- `mechanicId`, `mechanicName`
- `area`, `serviceType`
- `status` (`Pending`, `Accepted`, `Rejected`, `Completed`)

