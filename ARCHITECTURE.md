# GarageGo — Architecture (Simple Version)

> **One line:** GarageGo is **"Uber for roadside assistance"** — it connects stranded vehicle owners with the nearest available mechanic in real time.

---

## 1. The Big Picture — Only 3 Parts

The whole project is just **3 building blocks** talking to each other:

1. **React Frontend** — the website the customer and mechanic see.
2. **Firebase** — handles login (Auth), stores data (Firestore), delivers push notifications (FCM).
3. **Node.js + Express Backend** — a small protected API that sends notifications securely and runs the "safety net" (fallback calls + reassigning mechanics).

```
 +--------------+                      +--------------+
 |   CUSTOMER   |                      |   MECHANIC   |
 |  (browser)   |                      |  (browser)   |
 +------+-------+                      +------+-------+
        |                                     |
        +------------------+------------------+
                           |
                  REACT FRONTEND (Vite)
         (pages, dashboards, map, GPS location)
                           |
        +------------------+-------------------+
        |                  |                   |
 FIREBASE AUTH      CLOUD FIRESTORE      EXPRESS BACKEND
 (login, signup,    (NoSQL database:     (Node.js API)
  Google login,      users +             verifies user token,
  roles)             serviceRequests)    sends notifications,
        |                  |             runs fallback timers
        |                  |                   |
        |                  |          +--------+--------+
        |                  |          |                 |
        +------------------+   FIREBASE ADMIN      TWILIO API
        |                        (sends FCM push   (automated phone
        |                         to devices)       call to mechanic)
        v                             |
 Push notification <------------------+
 appears on the device
```

---

## 2. What Each Part Does (In Plain Words)

### A. React Frontend (`src/`)
- Pages: Login, Signup, Role Selection, Customer Dashboard, Mechanic Dashboard.
- Captures the customer's **live GPS location** (browser Geolocation API) with a manual hub fallback.
- Mechanics choose a **fixed garage hub** (hardcoded real coordinates) during onboarding — no fake locations anywhere.
- Shows nearby mechanics on a Leaflet map ranked by real distance/ETA, plus a static route map per request.
- Talks **directly to Firebase** for login + data, and talks to **our Express backend** only for push notifications (optional layer).

### B. Firebase (the "backend-as-a-service")
- **Firebase Auth** → who the user is (email/password or Google). Each user gets a **role**: customer or mechanic.
- **Cloud Firestore** → the database. Only 2 main collections:
  - `users` → name, role, city, service area, garage details, availability (`available` / `busy`), FCM tokens.
  - `serviceRequests` → the breakdown job: status (`Pending → Accepted → Completed / Rejected`), assigned mechanic, customer GPS location, OTP, and a **routing queue** (backup mechanics list).
- **Realtime listeners** (`onSnapshot`) → both dashboards update live with no refresh, and drive the in-app notification toasts (works even when the backend is offline).
- **Firestore Security Rules** → database-level security: customers can only create their own requests; mechanics can only update requests assigned to them.
- **FCM (Firebase Cloud Messaging)** → the push notification delivery system.

### C. Express Backend (`server/`)
Why does it exist if Firebase does so much? **Two reasons:**
1. Sending push notifications needs the **Firebase Admin SDK**, which holds secret keys — it must live on a server, never in the browser.
2. Someone must watch the clock — if a mechanic ignores a request, the backend fires the **Twilio fallback phone call** and moves the request to the next mechanic.

It exposes 3 protected endpoints (each requires the user's Firebase ID token):
- `POST /api/notifications/request-created` → push to mechanic + schedule fallback call
- `POST /api/notifications/request-accepted` → push to customer + cancel fallback call
- `POST /api/notifications/request-declined` → move request to next mechanic + notify them

---

## 3. The Complete Request Flow (The Heart of the Project)

```
1. Customer's GPS location is fetched (manual hub fallback if denied)
2. Nearby mechanics appear on a map, ranked by REAL distance/ETA (Haversine)
3. Customer picks a mechanic + problem  ->  that mechanic is queue rank #1,
   other nearby mechanics follow by distance (ROUTING QUEUE)
4. Request created in Firestore (status: Pending)  ->  assigned to nearest mechanic
5. Frontend calls backend  ->  backend verifies token  ->  FCM push to mechanic
      + fallback Twilio call scheduled for 60 seconds later
6. Mechanic decides:
   |-- ACCEPT    -> status Accepted, mechanic marked "busy",
   |                customer gets push + live tracking map, fallback call cancelled
   |-- REJECT    -> backend transaction moves request to NEXT mechanic in queue,
   |                new push + new fallback call scheduled
   |-- NO REPLY  -> after 60s, Twilio calls the mechanic's phone,
                    request auto-moves to the next mechanic
7. Job done  ->  mechanic generates a 4-digit OTP  ->  customer reads it out  ->
   mechanic enters it  ->  status Completed  ->  mechanic becomes available again
```

---

## 4. The 4 "Smart" Ideas (What Makes It Impressive)

1. **Routing Queue** — every request carries a sorted backup list of mechanics (like Uber's dispatch system). Rejection or timeout simply moves to the next one — the customer is never stranded.
2. **Database Transactions** — reassignment happens inside a Firestore transaction, so two mechanics can never grab the same request at the same time (no race conditions).
3. **Fault-Tolerant Notifications** — in-app realtime toasts via Firestore listeners always work (zero backend needed). Push layer: the client health-checks the backend first and retries with a timeout. Nobody answers? A real phone call fires via Twilio. Server restarts? A sweep loop re-arms pending fallback timers every 15 seconds from data persisted in Firestore.
4. **OTP Completion** — the request closes only when the mechanic enters the OTP shown on the customer's screen — proof the job was actually done (same pattern as Uber / delivery PIN verification).

---

## 5. Tech Stack (One Line Each)

| Layer | Tech | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast UI, reusable components |
| Styling | Tailwind CSS | Rapid, consistent design |
| Maps | Leaflet + React Leaflet | Free, open-source maps (no billing like Google Maps) |
| Auth | Firebase Authentication | Ready-made secure login (email + Google) |
| Database | Cloud Firestore | Real-time sync — dashboards update live without refresh |
| Push | Firebase Cloud Messaging | Native browser/phone notifications |
| Backend | Node.js + Express | Keeps Admin SDK + Twilio secrets server-side |
| Fallback calls | Twilio Voice API | Automated reminder phone call to the mechanic |

---

## 6. Glossary (If You Forget a Term)

- **FCM token** → the "device address" Firebase needs to send a push to a specific phone/browser.
- **Service Worker** → a background script that shows notifications even when the tab is closed.
- **Routing queue** → the ordered backup list of mechanics stored inside each request.
- **Garage hub** → a hardcoded real-world garage location the mechanic picks during onboarding.
- **Haversine formula** → the math used to calculate distance between two GPS coordinates.
- **ETA** → estimated time of arrival (distance ÷ 30 km/h average city speed).
- **Firestore transaction** → an all-or-nothing database operation (prevents double-booking).
- **Firebase ID token** → a JWT the frontend sends to the backend to prove "I am logged in".
- **OTP** → the 4-digit code that closes a request after the service is done.

