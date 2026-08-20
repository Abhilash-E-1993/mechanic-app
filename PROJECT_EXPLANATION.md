# GarageGo — Complete Project Explanation + Interview Guide

> **How to use this file:** Read `ARCHITECTURE.md` first for the big picture (5 min), then read this file top to bottom. Sections 1 and 2 are ready-made scripts — memorize them. The rest gives you depth so you never get stuck on a follow-up question.

---

## 1. The 30-Second Pitch (Memorize This)

> "GarageGo is a real-time roadside vehicle breakdown assistance platform — think of it as **Uber for mechanics**. If your vehicle breaks down, you open the app, choose your problem, and the platform instantly matches you with the **nearest available mechanic** using GPS-based distance ranking. The mechanic gets a **push notification** and can accept or reject. If they reject — or don't respond within **60 seconds** — the system automatically places a **Twilio reminder call** and reassigns the request to the **next mechanic in the queue**. The job closes only after **OTP verification** between the customer and the mechanic. It's built with **React, Firebase, and a Node.js/Express backend**."

---

## 2. The 2-Minute Version (When They Say "Tell Me About Your Project")

Follow this exact structure — problem → solution → flow → tech → the smart part:

1. **Problem (15 sec):** "When a vehicle breaks down, people frantically call random garages or wait helplessly on the road. There's no structured way to find the nearest available mechanic, notify them instantly, and track help until it arrives."

2. **Solution (15 sec):** "GarageGo connects stranded drivers with nearby mechanics in real time — request creation, smart matching, instant notification, live tracking, and verified completion, all in one flow."

3. **The flow (45 sec):** "A customer signs up, picks their city and area, and sees available mechanics ranked by ETA using the Haversine distance formula. They pick a problem type — puncture, battery, engine, oil leak — and confirm. The app captures their GPS location, builds a ranked routing queue of mechanics, and assigns the request to the nearest one. My Express backend verifies the user's Firebase ID token and sends an FCM push notification to the mechanic. The mechanic accepts or rejects from their dashboard. On accept, the customer gets notified and sees a live tracking map. On reject — or a 60-second timeout — a Firestore transaction moves the request to the next mechanic, and a Twilio voice call rings the mechanic's phone as a fallback. Finally, the mechanic closes the job with a 4-digit OTP shown on the customer's screen."

4. **Tech (20 sec):** "React + Vite on the frontend with Tailwind and Leaflet maps; Firebase Auth, Firestore, and Cloud Messaging as the backend-as-a-service; and a small Node/Express API that securely delivers notifications and runs the fallback call scheduler."

5. **The impressive part (25 sec):** "The part I'm most proud of is fault tolerance — a request can never silently die. Every request carries its own backup queue of mechanics, reassignment uses database transactions to prevent race conditions, push failures are retried on the client, and if everything else fails, an actual phone call goes out. Even a server restart doesn't lose pending fallback calls, because the schedule is persisted in Firestore and re-armed by a recovery sweep every 15 seconds."

---

## 3. The Problem It Solves

- Vehicle breakdowns are unpredictable and stressful.
- Finding a nearby mechanic today means calling random numbers from Google Maps with no guarantee of availability.
- There's no accountability — no tracking, no confirmation that help is actually coming, no proof of service.

**GarageGo fixes this with:** location-based mechanic discovery, instant push alerts, automatic reassignment (nobody is left stranded), live status tracking, and OTP-verified completion.

---

## 4. Complete Feature List

- **Authentication:** Email/password + Google sign-in, persistent sessions, profile caching for instant loads.
- **Role-based onboarding:** Every user picks a role — customer or mechanic. Mechanics add garage name, 10-digit phone, experience, services offered, city, and service area.
- **GPS-first mechanic discovery:** The customer's **live GPS location** is auto-detected (with a manual landmark fallback). Nearby mechanics appear on a **map** and in a list ranked by real distance/ETA — no manual area selection.
- **Fixed garage hubs:** Mechanics pick their garage location at onboarding from **72 hardcoded real hubs** across 12 cities — every mechanic has genuine, verifiable coordinates.
- **Smart matching:** Mechanics are ranked by real distance (Haversine formula over GPS coordinates) and ETA (distance ÷ 30 km/h city average). The mechanic the customer clicks is always queue rank #1.
- **Request lifecycle:** Pending → Accepted → Completed / Rejected, with realtime updates on both dashboards.
- **Push notifications:** FCM push to mechanic on new request, and to customer on acceptance — delivered both in-app (toast) and as system notifications via a service worker.
- **Fault-tolerant dispatch:** Routing queue + Firestore transactions + Twilio fallback call after 60 seconds of silence + auto-reassignment.
- **Route map:** The customer and the mechanic's fixed garage are shown on a Leaflet map with real distance, ETA, and a Google Maps navigate deep-link — no fake/simulated movement.
- **Realtime everything:** Both dashboards use Firestore `onSnapshot` listeners — requests, status changes, and reassignments appear instantly with in-app toast alerts (works even when the backend is offline).
- **OTP completion:** 4-digit OTP shown to the customer; the mechanic must enter it to close the job.
- **Safety rules:** One active job per mechanic, one accepted request per customer, no duplicate requests to the same mechanic.

---

## 5. Complete User Journeys (Know These Step by Step)

### Customer Journey
1. Signs up / logs in (email or Google).
2. Selects role = **customer** on the role-selection page.
3. The dashboard **auto-detects their GPS location** (manual landmark fallback if permission is denied).
4. Sees **nearby mechanics on a live map and in a list**, ranked by real distance/ETA — the closest one gets a "Closest Match" badge.
5. Clicks **"Request Help"** on a mechanic → picks a service type (Tyre puncture, Battery issue, Engine problem, Oil leak, General breakdown) → confirms.
6. The clicked mechanic becomes **rank #1 in the routing queue**; other nearby mechanics follow by distance. The request is created with the customer's real GPS location.
7. Backend is called → mechanic gets a **push notification**.
8. Customer's **"My Service Requests"** section updates **in real time** (Firestore listener — no refresh needed).
9. When the mechanic accepts → customer gets a push ("Mechanic is on the way"), sees the **live tracking map**, can **call the mechanic**, and later sees the **4-digit OTP** to share.
10. Mechanic enters the OTP → request shows **Completed**.

### Mechanic Journey
1. Signs up / logs in → selects role = **mechanic**.
2. Fills profile: garage name, 10-digit phone, experience, services offered, and picks a **fixed garage hub** from a map-backed list of hardcoded locations → status becomes **available**.
3. Gets an **instant in-app toast + beep** via the Firestore realtime listener when a request is assigned (plus an FCM push when the backend is running). Their dashboard updates live — no refresh needed.
4. Dashboard shows the incoming request with customer name, problem, location, and ETA.
5. Mechanic can:
   - **Accept** → status changes to Accepted, mechanic becomes "busy", customer is notified, fallback call cancelled.
   - **Reject** → request automatically moves to the next mechanic in the queue.
   - **Ignore** → after 60 seconds, Twilio calls their phone AND the request moves to the next mechanic.
6. After reaching the customer and fixing the vehicle → clicks **"Generate OTP"**.
7. Customer reads out the OTP → mechanic enters it → request **Completed** → mechanic becomes available again.

---

## 6. Tech Stack + WHY Each Choice (Interviewers Love "Why")

| Technology | What it does | Why I chose it |
|---|---|---|
| **React 18 + Vite** | Frontend UI | Component reusability, huge ecosystem; Vite gives instant dev server and fast builds |
| **Tailwind CSS** | Styling | Fast, consistent, utility-first design without writing custom CSS files |
| **React Router** | Navigation | Protected routes and role-based dashboard rendering |
| **Firebase Authentication** | Login/signup | Battle-tested auth with email + Google OAuth out of the box; no need to build password hashing myself |
| **Cloud Firestore** | Database | **Real-time listeners** (`onSnapshot`) — both dashboards update live without refresh; NoSQL flexibility for evolving request schema |
| **Firestore Security Rules** | DB-level security | Even if someone tampers with the frontend JS, the database itself rejects unauthorized reads/writes |
| **Firebase Cloud Messaging** | Push notifications | Native system notifications on phone/browser, works even when the tab is closed (service worker) |
| **Node.js + Express** | Backend API | Firebase Admin SDK and Twilio secrets must stay server-side; Express is minimal and perfect for a small protected API |
| **Firebase Admin SDK** | Server-side Firebase | Verifies user ID tokens, sends pushes, runs Firestore transactions with elevated privileges |
| **Twilio Voice API** | Fallback phone calls | The ultimate "can't-miss" channel — a phone call rings even if push fails or the app is closed |
| **Leaflet + React Leaflet** | Maps & tracking | Free and open-source (Google Maps needs billing); renders customer location, mechanic marker, and route polyline |
| **Browser Geolocation API** | Customer GPS | No extra hardware/app needed — the browser provides coordinates |

---

## 7. Database Design (2 Collections)

### `users` collection (one doc per user)
| Field | Meaning |
|---|---|
| `name`, `email` | Basic profile |
| `role` | `"customer"` or `"mechanic"` |
| `city`, `serviceArea` | Where they operate |
| `garageName`, `phoneNumber`, `experienceYears`, `services[]` | Mechanic-only details |
| `availabilityStatus` | `"available"` or `"busy"` — drives matching |
| `fcmToken`, `fcmTokens[]` | Device addresses for push notifications (multi-device support) |

### `serviceRequests` collection (one doc per breakdown job)
| Field | Meaning |
|---|---|
| `customerId`, `customerName`, `customerLocation` | Who needs help + GPS |
| `mechanicId`, `mechanicName`, `garageName`, `mechanicPhoneNumber` | Currently assigned mechanic |
| `status` | `Pending` / `Accepted` / `Rejected` / `Completed` |
| `serviceType` | The problem (puncture, battery, ...) |
| `mechanicRoutingQueue[]` | **The backup list** — ranked mechanics with their ETA/distance |
| `mechanicRoutingIndex` | Which position in the queue is currently assigned |
| `currentMechanicEtaMinutes`, `currentMechanicDistanceKm` | ETA/distance of assigned mechanic |
| `completionOTP`, `otpGeneratedAt` | The 4-digit completion code |
| `fallbackCallStatus`, `fallbackCallScheduledFor` | Fallback call scheduling state (persisted so server restarts don't lose it) |

---

## 8. The 5 Smartest Parts (Deep Dive — This Is What Impresses Interviewers)

### 1. The Routing Queue (Uber-style dispatch)
- When a request is created, the app doesn't just pick ONE mechanic — it stores a **ranked list of all available mechanics** inside the request document (`mechanicRoutingQueue`).
- If the assigned mechanic rejects or times out, the backend simply advances an index to the next mechanic in the queue.
- **Say this:** *"Every request carries its own backup plan, so a rejection never leaves the customer stranded."*

### 2. Firestore Transactions (no race conditions)
- Reassignment runs inside `db.runTransaction()` — the request is read, validated (still Pending? same mechanic?), updated, and the next mechanic verified as available, **all-or-nothing**.
- A second transaction "claims" the fallback call (`scheduled → triggering`) so duplicate calls can never fire even if two timers race.
- Plus a business rule: a mechanic can only hold **one Accepted job** at a time (checked before every accept).
- **Say this:** *"I used database transactions so two mechanics can never accept or be assigned the same job simultaneously."*

### 3. Fault-Tolerant Notification Pipeline (layered safety net)
- **Layer 1 — Client retry:** the frontend calls the backend with a 7-second timeout and retries up to 2 times with growing delays on network errors.
- **Layer 2 — Isolated failures:** the backend uses `Promise.allSettled`, so a push failure never blocks the fallback scheduling (and returns HTTP 207 for partial success).
- **Layer 3 — Twilio voice call:** if the mechanic doesn't respond in 60 seconds, an actual phone call rings their phone, and the request auto-advances to the next mechanic.
- **Layer 4 — Crash recovery:** fallback schedules are persisted in Firestore; a sweep loop runs every 15 seconds and re-arms any pending timers — so a server restart never loses a pending call.
- **Say this:** *"I designed it in layers so no single point of failure can kill a roadside request."*

### 4. OTP-Verified Completion (proof of service)
- Mechanic clicks "Generate OTP" → a 4-digit code appears on the **customer's** screen → mechanic enters it → request closes and mechanic becomes available again.
- Same trust pattern as Uber's trip PIN / delivery OTP — prevents fake completions.
- **Say this:** *"Completion requires physical proof — the OTP only exists on the customer's screen."*

### 5. FCM Token Lifecycle Management
- Users can have **multiple devices** — every device's FCM token is stored in an array on the user doc.
- The backend sends to all tokens via multicast, detects dead tokens (`registration-token-not-registered`), and **automatically removes them** from Firestore — keeps the database clean and delivery rates high.
- **Say this:** *"I handle multi-device tokens and self-heal invalid ones after every send."*

---

## 9. How a Push Notification Travels (End-to-End, If Asked)

1. User logs in → `PushNotificationManager` registers the service worker → requests browser permission → FCM issues a **device token** → saved to the user's Firestore doc.
2. Customer creates a request → frontend POSTs to `/api/notifications/request-created` with the **Firebase ID token** in the Authorization header.
3. Express middleware **verifies the ID token** with Firebase Admin (rejects with 401 if invalid).
4. Backend also checks **authorization**: only the customer who created the request can trigger this endpoint (403 otherwise).
5. Backend reads the request + mechanic profile, confirms the mechanic supports the service, and sends the push to all the mechanic's FCM tokens.
6. Mechanic's device shows a **system notification** (service worker handles background; in-app toast handles foreground). Tapping it opens the dashboard.

---

## 10. Likely Interview Questions & Strong Answers

**Q: Why did you need an Express backend if Firebase does everything?**
> "Two reasons. One: sending push notifications requires the Firebase Admin SDK, which holds secret service-account keys — that can never ship to the browser. Two: I needed server-side timers for the 60-second fallback logic and the Twilio integration, whose credentials are also secret. The frontend talks to Firebase directly for data, but anything privileged goes through my backend, which verifies the user's Firebase ID token first."

**Q: How does mechanic matching work?**
> "The customer picks a city and area. I query Firestore for mechanics there who are available and support the requested service. Then I calculate real distance using the Haversine formula between the customer's GPS and each mechanic's location, estimate ETA assuming a 30 km/h city average, sort by ETA, and store that ranked list as the routing queue inside the request."

**Q: What happens if two mechanics try to accept the same request?**
> "Can't happen by design. A request has exactly one assigned mechanic at a time — the security rules only let the assigned mechanic update it. Reassignment happens in a Firestore transaction, which is all-or-nothing. And a mechanic is blocked from accepting a second job while one is active."

**Q: How is the app secured?**
> "Three layers: Firebase Authentication for identity, Firestore security rules that enforce ownership at the database level (customers create only their own requests; mechanics update only assigned ones), and my Express API verifies Firebase ID tokens and re-checks authorization on every endpoint. Secrets live in environment variables on the server only, and CORS is restricted to known origins."

**Q: What was the hardest challenge?**
> "Notification reliability. Early on, if a push failed or the mechanic's app was closed, the request just died. I fixed it in layers — client-side retries with timeouts, isolated failures on the server with Promise.allSettled, a Twilio voice fallback after 60 seconds, and persisting the fallback schedule in Firestore with a 15-second recovery sweep so server restarts don't lose pending calls."

**Q: Is the location tracking real?**
> "Yes on the customer side — it's the browser's live GPS. The mechanic's location is a fixed garage hub they choose at onboarding from 72 hardcoded real locations, so every distance and ETA on screen is genuine. The map shows the real route between the two points — I deliberately removed simulated movement so nothing in the demo is fake. A production version would stream the mechanic's live GPS from a driver app into the same request document."

**Q: How would you scale this?**
> "The backend is stateless except for timers, and even those are backed by Firestore state, so I can run multiple instances. Firestore scales horizontally. Next steps would be geohash-based spatial queries instead of city/area filtering, a real driver app for live GPS, and moving the fallback scheduler to a dedicated job queue like Cloud Tasks or BullMQ."

---

## 11. Numbers You Can Quote (All Real From the Code)

- **12 Indian cities** with **72 hardcoded garage hubs** (real coordinates)
- **5 service types** (puncture, battery, engine, oil leak, general)
- **60-second** fallback delay before the Twilio call fires
- **15-second** recovery sweep interval for crashed timers
- **4-digit** OTP for completion
- **7-second** API timeout + **2 client retries** with backoff
- **30 km/h** average city speed used for ETA
- **3 protected API endpoints**, all behind Firebase token verification
- **2 collections** in Firestore: `users`, `serviceRequests`

---

## 12. Future Improvements (Shows Maturity When Asked)

- Real-time GPS streaming from a mechanic driver app (replace simulated tracking)
- Geohash-based "nearby" search instead of fixed city/area lists
- Customer cancellation flow + mechanic availability toggle
- Payments integration (Razorpay/Stripe) and ratings/reviews
- Admin panel for mechanic verification
- Automated tests + CI pipeline

---

## 13. Quick Revision Card (Read Right Before the Interview)

- **What:** Uber for roadside assistance — real-time mechanic matching.
- **Flow:** request → nearest mechanic → push → accept/reject/timeout → OTP → done.
- **Stack:** React + Vite + Tailwind + Leaflet | Firebase Auth + Firestore + FCM | Node/Express | Twilio.
- **Smart bits:** routing queue, transactions, layered notification fallback, OTP, token cleanup.
- **Proudest of:** a request can never silently die — fault tolerance at every layer.



