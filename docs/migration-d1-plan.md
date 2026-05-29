# Firebase → Cloudflare D1 Migration Plan

> **Target Audience:** Beginner-level developers  
> **Goal:** Gradually replace Firebase Firestore + Auth with Cloudflare D1 + Workers  
> **Rule:** Keep Firebase working until each feature is fully tested on D1

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 1: API Service Wrapper](#2-phase-1-api-service-wrapper)
3. [Phase 2: D1 Schema Design](#3-phase-2-d1-schema-design)
4. [Phase 3: Users + Auth Migration](#4-phase-3-users--auth-migration)
5. [Phase 4: Attendance Migration](#5-phase-4-attendance-migration)
6. [Phase 5: Notifications (Polling)](#6-phase-5-notifications-polling)
7. [Phase 6: Orders + Jobs Migration](#7-phase-6-orders--jobs-migration)
8. [Phase 7: R2 Storage](#8-phase-7-r2-storage)
9. [How to Test Each Phase](#9-how-to-test-each-phase)
10. [Rollback Plan](#10-rollback-plan)

---

## 1. Architecture Overview

### Current (Firebase)

```
[App Screens] → FirebaseService → Firebase (Auth + Firestore + Storage)
```

### Target (Cloudflare)

```
[App Screens] → ApiService → Cloudflare Worker → D1 (SQLite) + R2 (Files)
                                    ↕
                              Auth Service (external or custom JWT)
```

### During Migration (Dual Mode)

```
[App Screens] → ApiService (wrapper)
                   ├── .useFirebase() → FirebaseService (old)
                   └── .useD1()       → CloudflareWorker (new)
```

### Key Design Pattern: The "Flag"

Each feature has a simple toggle:

```typescript
// config.ts
export const FEATURE_FLAGS = {
  users: 'firebase',    // 'firebase' | 'd1' | 'both'
  attendance: 'firebase',
  notifications: 'firebase',
  orders: 'firebase',
  storage: 'firebase',
};
```

This lets you switch one feature at a time. When a feature is on `'d1'`, the ApiService talks to the Cloudflare Worker instead of Firebase. If something breaks, flip it back to `'firebase'`.

---

## 2. Phase 1: API Service Wrapper

**Goal:** Create a single `api.ts` file that the app calls. Behind the scenes, it decides whether to use Firebase or D1.

### What to Build

**File:** `services/api.ts`

```typescript
// This file is the ONLY thing your screens import.
// Screens will call api.users.getProfile(id) instead of FirebaseService.getUserProfile(id)

import { apiConfig } from './apiConfig';
import { FirebaseAdapter } from './adapters/firebaseAdapter';
import { D1Adapter } from './adapters/d1Adapter';

class ApiService {
  private firebase = new FirebaseAdapter();
  private d1 = new D1Adapter();

  get users() {
    return apiConfig.users === 'd1' ? this.d1.users : this.firebase.users;
  }
  get attendance() {
    return apiConfig.attendance === 'd1' ? this.d1.attendance : this.firebase.attendance;
  }
  get notifications() {
    return apiConfig.notifications === 'd1' ? this.d1.notifications : this.firebase.notifications;
  }
  get orders() {
    return apiConfig.orders === 'd1' ? this.d1.orders : this.firebase.orders;
  }
  get storage() {
    return apiConfig.storage === 'd1' ? this.d1.storage : this.firebase.storage;
  }
}

export const api = new ApiService();
```

**File:** `services/apiConfig.ts`

```typescript
export const apiConfig = {
  // Toggle each feature independently
  users: 'firebase',        // 'firebase' | 'd1'
  attendance: 'firebase',
  notifications: 'firebase',
  orders: 'firebase',
  storage: 'firebase',
  
  // D1 worker URL (set when first D1 feature is ready)
  d1WorkerUrl: 'https://your-worker.yourname.workers.dev',
};
```

### Adapter Pattern (Beginner Explanation)

Think of adapters like **power plug converters**. The app expects a certain shape of functions:

```typescript
interface IUserAdapter {
  getProfile(uid: string): Promise<User>;
  updateProfile(uid: string, data: Partial<User>): Promise<User>;
}
```

- `FirebaseAdapter` implements this by calling Firebase (your existing code)
- `D1Adapter` implements the SAME interface by calling your Cloudflare Worker

The app doesn't care which one is underneath — it just calls `api.users.getProfile(uid)`.

### Step-by-step Implementation Plan

1. Create `services/adapters/` folder
2. Create `IUserAdapter.ts`, `IAttendanceAdapter.ts`, `INotificationAdapter.ts`, `IOrderAdapter.ts`, `IStorageAdapter.ts` interfaces
3. Copy existing FirebaseService code into `FirebaseAdapter` (refactored to implement each interface)
4. Create stub `D1Adapter` files that throw `"Not implemented yet"`
5. Create `api.ts` + `apiConfig.ts`
6. Update **one screen** (e.g., LoginScreen) to use `api.users.getProfile()` instead of `FirebaseService.getUserProfile()`
7. Verify it still works (it's using Firebase underneath)
8. Repeat for all screens

> **⚠️ Do NOT delete FirebaseService.ts yet.** The adapters will wrap it. You delete it only after ALL features are on D1.

---

## 3. Phase 2: D1 Schema Design

**Goal:** Design SQL tables that replace Firestore collections. Created as a separate Cloudflare Workers project.

### Where to Put It

New project structure (separate from your React Native app):

```
qrscanner-worker/          ← New Cloudflare Worker project
├── wrangler.toml
├── src/
│   ├── index.ts           ← Router (honox or itty-router)
│   ├── db/
│   │   └── schema.sql     ← D1 table definitions
│   ├── handlers/
│   │   ├── users.ts
│   │   ├── attendance.ts
│   │   ├── notifications.ts
│   │   ├── orders.ts
│   │   └── storage.ts
│   └── middleware/
│       └── auth.ts
```

### Schema: users

```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,          -- Firebase UID (reuse same ID)
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'sales_rep',  -- 'user'|'admin'|'super_admin'|'sales_rep'|'printer_staff'
  username    TEXT,
  contact     TEXT,
  designation TEXT,
  address     TEXT,
  profile_image TEXT,
  timezone    TEXT,
  language    TEXT DEFAULT 'en',
  joined_groups TEXT DEFAULT '[]',       -- JSON array (simple for now)
  personal_qr_code TEXT,
  two_factor_enabled INTEGER DEFAULT 0,  -- SQLite uses 0/1 for booleans
  notification_settings TEXT DEFAULT '{}', -- JSON object
  work_start_time TEXT DEFAULT '09:00',
  work_end_time TEXT DEFAULT '17:00',
  is_active   INTEGER DEFAULT 1,
  email_verified INTEGER DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Schema: attendance_records

```sql
CREATE TABLE attendance_records (
  id            TEXT PRIMARY KEY,         -- Same composite ID: groupId_sessionId_userId_date
  user_id       TEXT NOT NULL,
  employee_id   TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  date          TEXT NOT NULL,            -- 'YYYY-MM-DD'
  check_in_time TEXT NOT NULL,
  check_out_time TEXT,
  status        TEXT NOT NULL DEFAULT 'Present',  -- 'Present'|'Late'|'Absent'|'WeekOff'|'Holiday'
  qr_code_data  TEXT NOT NULL,
  qr_session_id TEXT,
  group_id      TEXT,
  working_hours REAL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_attendance_user_date ON attendance_records(user_id, date);
CREATE INDEX idx_attendance_group ON attendance_records(group_id, date);
CREATE UNIQUE INDEX idx_attendance_dedup ON attendance_records(qr_session_id, user_id, date);
```

### Schema: notifications

```sql
CREATE TABLE notifications (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,          -- 'user_invite'|'attendance'|'event'|'qr_management'|'general'|'join_request'
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  is_read         INTEGER DEFAULT 0,
  user_id         TEXT,
  admin_id        TEXT,
  priority        TEXT DEFAULT 'medium',
  action_url      TEXT,
  metadata        TEXT DEFAULT '{}',      -- JSON
  target_audience TEXT NOT NULL,          -- 'admin'|'user'
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_admin ON notifications(admin_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(is_read, target_audience);
```

### Schema: groups, orders, jobs

Similar pattern — see Appendix at the end.

### Schema Migration Strategy

Use Cloudflare D1 migrations:

```bash
npx wrangler d1 migrations create qrscanner-db create_users
npx wrangler d1 migrations apply qrscanner-db --remote
```

Each migration file adds tables. You don't need to plan everything upfront — add tables as you migrate each phase.

---

## 4. Phase 3: Users + Auth Migration

**Goal:** Move user profiles to D1, keep Firebase Auth for login.

### Why Keep Firebase Auth?

Firebase Auth handles:
- Email/password hashing
- Password reset emails
- Session management

Cloudflare D1 has **no auth system**. You have two options:
1. **Hybrid (recommended for beginners):** Keep Firebase Auth for login/logout. Only move the *user profile data* (name, role, settings) to D1. After login, fetch profile from D1 using the Firebase UID.
2. **Full replacement:** Use a 3rd-party auth like Auth0 or Supabase Auth (much more complex).

### Flow After Migration

```
App startup → Firebase Auth state listener
                  ↓
User logged in? → Yes → Call D1 API: GET /api/users/:firebaseUid
                  ↓
              Return User profile from D1
                  ↓
              App shows home screen
```

### Step-by-step

1. **Create D1 user endpoints in the Worker:**
   - `GET /api/users/:id` — Get profile
   - `POST /api/users` — Create profile (called after Firebase registration)
   - `PATCH /api/users/:id` — Update profile

2. **Build D1Adapter.users:**
   - Implements `IUserAdapter` by calling `fetch('https://worker/users/...')`
   - On registration: call Firebase Auth to create account, THEN call D1 to create profile
   - On login: call Firebase Auth to sign in, THEN fetch profile from D1

3. **Set `apiConfig.users = 'd1'`**
4. **Test:** Register a new user, log in, edit profile — everything works through D1
5. **Seed existing users:** Write a script that reads all users from Firestore and inserts them into D1

### Seed Script Concept

```typescript
// scripts/seed-users.ts (runs ONCE locally)
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function seedUsers() {
  const snap = await getDocs(collection(db, 'users'));
  for (const doc of snap.docs) {
    const user = { id: doc.id, ...doc.data() };
    // POST each user to your D1 worker: /api/users/import
    await fetch('https://worker/users/import', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }
  console.log(`✅ Seeded ${snap.docs.length} users`);
}
```

---

## 5. Phase 4: Attendance Migration

**Goal:** Move `validateAndRecordAttendance` + attendance records to D1.

### Why Attendance First?

- It's a **write-heavy** feature (each scan = 1 write)
- Firestore writes cost money; D1 is cheaper for high-volume writes
- It has clear, simple logic (validate session → check membership → record attendance)

### D1 Worker Endpoints

- `POST /api/attendance/validate` — Validate QR + record attendance
- `GET /api/attendance/records?userId=X&date=YYYY-MM-DD` — Get attendance history
- `GET /api/attendance/stats?userId=X&month=YYYY-MM` — Get monthly stats

### The Validation Logic (translated to SQL)

In Firebase (current code at line 296-344):
1. Get QR session by ID
2. Check if active + within valid time window
3. Check if user is approved group member
4. Check duplicate attendance (same session + user + date)
5. Create attendance record
6. Increment scan count

In D1 Worker (new code):

```typescript
// handlers/attendance.ts
export async function validateAttendance(request, env) {
  const { qrSessionId, userId, rawQRData } = await request.json();
  
  const db = env.DB; // D1 binding
  
  // Step 1: Check QR session
  const session = await db.prepare(
    'SELECT * FROM qr_sessions WHERE id = ?'
  ).bind(qrSessionId).first();
  
  if (!session) throw new Error('QR session not found');
  if (!session.is_active) throw new Error('QR session is inactive');
  
  const now = new Date().toISOString();
  if (now < session.valid_from || now > session.valid_until) {
    throw new Error('QR session is expired or not active yet');
  }
  
  // Step 2: Check membership
  const member = await db.prepare(
    'SELECT * FROM group_memberships WHERE group_id = ? AND user_id = ? AND status = ?'
  ).bind(session.group_id, userId, 'approved').first();
  
  if (!member) throw new Error('You are not an approved member of this group');
  
  // Step 3: Check duplicate (UNIQUE index handles this too)
  const today = now.slice(0, 10);
  const existing = await db.prepare(
    'SELECT id FROM attendance_records WHERE qr_session_id = ? AND user_id = ? AND date = ?'
  ).bind(qrSessionId, userId, today).first();
  
  if (existing) throw new Error('Attendance already recorded for this session');
  
  // Step 4: Insert record + update scan count (in a transaction)
  const attendanceId = `${session.group_id}_${qrSessionId}_${userId}_${today}`;
  
  await db.batch([
    db.prepare(`
      INSERT INTO attendance_records (id, user_id, employee_id, employee_name, date, check_in_time, status, qr_code_data, qr_session_id, group_id)
      VALUES (?, ?, ?, ?, ?, ?, 'Present', ?, ?, ?)
    `).bind(attendanceId, userId, member.employee_id, member.user_name, today, now, rawQRData, qrSessionId, session.group_id),
    
    db.prepare(`
      UPDATE qr_sessions SET scan_count = scan_count + 1, updated_at = datetime('now') WHERE id = ?
    `).bind(qrSessionId),
  ]);
  
  return new Response(JSON.stringify({ id: attendanceId, status: 'Present' }));
}
```

### Polling for Attendance Lists (Replacing onSnapshot)

Currently, attendance lists may use real-time listeners. Replace with **simple polling**:

```typescript
// In the app screen
useEffect(() => {
  fetchAttendance(); // Initial load
  
  const interval = setInterval(fetchAttendance, 30000); // Poll every 30 seconds
  return () => clearInterval(interval);
}, []);

async function fetchAttendance() {
  const records = await api.attendance.getRecords(user.id, today);
  setRecords(records);
}
```

30 seconds is a good starting point. You can adjust:
- 10 seconds = near real-time but more API calls
- 60 seconds = fewer API calls but slower updates

---

## 6. Phase 5: Notifications (Polling)

**Goal:** Replace Firebase `onSnapshot` real-time notifications with polling.

### Current Problem

Firebase's `onSnapshot` gives instant push updates. D1 can't do that easily.

### The Polling Solution

```typescript
// services/adapters/d1Adapter.ts → notifications
class D1NotificationAdapter implements INotificationAdapter {
  private lastPolledAt: string = new Date().toISOString();
  private pollingInterval: number | null = null;

  subscribe(userId: string, role: string, callback: (items: AppNotification[]) => void) {
    // Poll every 15 seconds
    this.pollingInterval = setInterval(async () => {
      const newItems = await this.getNewNotifications(userId, role, this.lastPolledAt);
      if (newItems.length > 0) {
        this.lastPolledAt = new Date().toISOString();
        callback(newItems);
      }
    }, 15000);

    // Return an unsubscribe function (same pattern as Firebase's onSnapshot)
    return () => {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    };
  }

  private async getNewNotifications(userId: string, role: string, since: string): Promise<AppNotification[]> {
    const targetAudience = role === 'user' ? 'user' : 'admin';
    const userField = role === 'user' ? 'user_id' : 'admin_id';
    
    const response = await fetch(
      `${apiConfig.d1WorkerUrl}/api/notifications?${userField}=${userId}&target=${targetAudience}&since=${since}`
    );
    return response.json();
  }

  async createNotification(payload: Omit<AppNotification, 'id' | 'createdAt'>) {
    await fetch(`${apiConfig.d1WorkerUrl}/api/notifications`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async markAsRead(id: string) {
    await fetch(`${apiConfig.d1WorkerUrl}/api/notifications/${id}/read`, { method: 'PATCH' });
  }

  async deleteNotification(id: string) {
    await fetch(`${apiConfig.d1WorkerUrl}/api/notifications/${id}`, { method: 'DELETE' });
  }

  async markAllAsRead(userId: string, role: string) {
    await fetch(`${apiConfig.d1WorkerUrl}/api/notifications/read-all?userId=${userId}&role=${role}`, { method: 'PATCH' });
  }
}
```

### D1 Worker Endpoints for Notifications

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/notifications` | POST | Create a notification |
| `/api/notifications?userId=X&target=admin&since=ISO` | GET | Get new notifications (polling) |
| `/api/notifications/:id/read` | PATCH | Mark one as read |
| `/api/notifications/:id` | DELETE | Delete one notification |
| `/api/notifications/read-all` | PATCH | Mark all as read for a user |

### Polling vs. WebSockets — Why Polling First

| Approach | Pros | Cons |
|----------|------|------|
| **Polling (chosen)** | Simple, no extra infra, works everywhere | 15s delay, more HTTP calls |
| **WebSocket** | Instant updates | Requires Durable Objects (complex) |
| **SSE (Server-Sent Events)** | Near-real-time, simpler than WS | Not all clients support it |

**Rule of thumb:** Start with 15-second polling. If users complain about notification delays, switch to SSE later.

---

## 7. Phase 6: Orders + Jobs Migration

**Goal:** Move sales orders and printer jobs to D1.

### Why Last?

- Orders and jobs involve the **most complex transactions** (createOrder creates both an order AND a job, setJobStage updates both, uploadQaVideo updates 3 collections)
- Firebase's multi-document updates are easier to reason about

### D1 Worker Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/orders` | POST | Create sales order (+ job) |
| `/api/orders?salesRepId=X` | GET | List orders for a sales rep |
| `/api/orders/:id` | PATCH | Update order status |
| `/api/payouts/:salesRepId` | GET | Get payout summary |
| `/api/jobs` | GET | List all printer jobs |
| `/api/jobs/:id/stage` | PATCH | Update job stage |
| `/api/jobs/:id/lock` | POST | Lock NFC chip |

### The Transaction Pattern (Critical)

The `createSalesOrder` method (lines 360-398) does this in one function:
1. Calculate commission
2. Create order document
3. Create job document
4. Update order document with jobId

In D1, use `db.batch()` to do all steps atomically:

```typescript
export async function createSalesOrder(request, env) {
  const body = await request.json();
  const db = env.DB;

  const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
  const commissionAmount = Math.round(body.price * 0.1 * 100) / 100;
  const orderId = crypto.randomUUID();
  const jobId = crypto.randomUUID();

  const results = await db.batch([
    // Insert order
    db.prepare(`
      INSERT INTO orders (id, order_number, customer_name, contact, product_type, 
        payment_option, price, status, sales_rep_id, sales_rep_name, commission_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'in_queue', ?, ?, ?)
    `).bind(orderId, orderNumber, body.customerName, body.contact,
      body.productType, body.paymentOption, body.price,
      body.salesRepId, body.salesRepName, commissionAmount),

    // Insert job
    db.prepare(`
      INSERT INTO jobs (id, order_id, order_number, customer_name, product_type,
        stage, wage, priority)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(jobId, orderId, orderNumber, body.customerName,
      body.productType,
      body.productType === 'metal_card' ? 6 : 4,
      body.paymentOption === 'online_discount' ? 'high' : 'normal'),

    // Link job to order
    db.prepare(`UPDATE orders SET job_id = ? WHERE id = ?`).bind(jobId, orderId),
  ]);

  return new Response(JSON.stringify({ orderId, jobId, orderNumber }));
}
```

### Real-time List → Polling

Same pattern as notifications:

```typescript
// Before (Firebase real-time)
useEffect(() => {
  return FirebaseService.subscribeSalesOrders(user.id, setOrders);
}, [user]);

// After (Polling every 30 seconds)
useEffect(() => {
  fetchOrders();
  const interval = setInterval(fetchOrders, 30000);
  return () => clearInterval(interval);
}, [user]);

async function fetchOrders() {
  const orders = await api.orders.getSalesOrders(user.id);
  setOrders(orders);
}
```

---

## 8. Phase 7: R2 Storage

**Goal:** Replace Firebase Storage with Cloudflare R2 for QA video uploads.

### Why Last?

- R2 is separate from D1 — no database changes needed
- Only one function uses it: `uploadQaVideo` (lines 430-452)
- It only affects the QA screen: `app/(printer)/qa/[jobId].tsx`

### The Migration

1. **Create R2 bucket** in Cloudflare dashboard
2. **Create Worker endpoint** that accepts file uploads and stores in R2:

```typescript
// Worker handler for file upload
export async function uploadFile(request, env) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const jobId = formData.get('jobId') as string;
  
  const key = `qa-videos/${jobId}/${Date.now()}.mp4`;
  await env.VIDEOS_BUCKET.put(key, file);
  
  const url = `${env.R2_PUBLIC_URL}/${key}`;
  
  // Update the job record in D1 with the video URL
  await env.DB.prepare(
    'UPDATE jobs SET qa_video_url = ?, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(url, jobId).run();
  
  // Update order status to completed
  await env.DB.prepare(
    'UPDATE orders SET status = \'completed\', commission_unlocked = 1, updated_at = datetime(\'now\') WHERE id = ?'
  ).bind(orderId).run();
  
  return new Response(JSON.stringify({ url }));
}
```

3. **In the app**, replace Firebase Storage upload with a simple fetch:

```typescript
// Before (Firebase)
await FirebaseService.uploadQaVideo(job.id, job.orderId, videoUri, user.id);

// After (R2 via Worker)
const formData = new FormData();
formData.append('file', { uri: videoUri, type: 'video/mp4', name: 'video.mp4' });
formData.append('jobId', job.id);
formData.append('orderId', job.orderId);

const response = await fetch(`${apiConfig.d1WorkerUrl}/api/storage/upload`, {
  method: 'POST',
  body: formData,
});
```

---

## 9. How to Test Each Phase

### Before switching a feature to D1

1. **Run the seed script** to copy existing data from Firebase to D1
2. **Verify with a curl/test:** Call the D1 Worker endpoint directly and check results
3. **Guest mode check:** Make sure the app's guest/test mode still works

### After switching a feature to D1

1. **Use the app normally** for 30 minutes. Does everything work?
2. **Check the Worker logs** (`wrangler tail`) — any errors?
3. **Check Firebase bills** — did costs go down?

### Rollback (if something breaks)

```typescript
// In apiConfig.ts — just flip the flag back
export const apiConfig = {
  users: 'firebase',  // ← Changed from 'd1' back to 'firebase'
  attendance: 'd1',   // Working fine
  notifications: 'firebase',
  orders: 'firebase',
  storage: 'firebase',
};
```

The app will immediately use Firebase again for users. No code redeploy needed (if you use feature flags that don't require rebuild).

### Dual-Run Mode (Advanced)

If you want extra safety, run both Firebase and D1 side-by-side:

```typescript
// In adapter
async getProfile(uid: string): Promise<User> {
  // Write to both, read from D1
  const d1Promise = this.d1.users.getProfile(uid).catch(() => null);
  const fbPromise = this.firebase.users.getProfile(uid);
  
  // Wait for Firebase (source of truth for now)
  const fbUser = await fbPromise;
  
  // Silently update D1 in the background
  if (d1Promise) {
    this.d1.users.updateProfile(uid, fbUser).catch(() => {});
  }
  
  return fbUser;
}
```

This way, D1 gradually catches up with Firebase data, and you can switch over when confident.

---

## 10. Rollback Plan

### If D1 goes down

```typescript
// Auto-detect D1 failure and fall back to Firebase
class SmartAdapter {
  private d1Available = true;

  async getProfile(uid: string): Promise<User> {
    if (this.d1Available) {
      try {
        return await this.d1.users.getProfile(uid);
      } catch (error) {
        console.warn('D1 unavailable, falling back to Firebase');
        this.d1Available = false;
        // Notify the developer
        await this.reportOutage('D1', error);
      }
    }
    return this.firebase.users.getProfile(uid);
  }

  // Retry D1 every 5 minutes
  private retryTimer = setInterval(async () => {
    try {
      await this.d1.healthCheck();
      this.d1Available = true;
      console.log('D1 is back online');
    } catch {}
  }, 300000);
}
```

### If the whole migration fails

Keep the Firebase files intact. Since you never deleted them, you can:
1. Revert `apiConfig.ts` to all `'firebase'` values
2. The app works exactly as before
3. Take your time to fix the Worker code
4. Try again later

---

## Appendix A: Complete File Change Summary

| Phase | New Files | Modified Files | Deleted Files |
|-------|-----------|----------------|---------------|
| 1 | `services/api.ts`, `services/apiConfig.ts`, `services/adapters/*.ts` | Each screen (one by one) | None |
| 2 | `qrscanner-worker/` (entire project) | None | None |
| 3 | `scripts/seed-users.ts` | `apiConfig.ts` (set `users: 'd1'`), `D1Adapter.users` | None |
| 4 | `scripts/seed-attendance.ts` | `apiConfig.ts` (set `attendance: 'd1'`), `D1Adapter.attendance` | None |
| 5 | None | `D1Adapter.notifications`, notification screens (polling) | None |
| 6 | `scripts/seed-orders.ts` | `apiConfig.ts` (set `orders: 'd1'`), `D1Adapter.orders` | None |
| 7 | None | `D1Adapter.storage`, QA screen | None |
| Final | None | `apiConfig.ts` (remove Firebase imports) | `services/firebaseService.ts` |

> **🚫 Do NOT delete FirebaseService.ts until ALL phases are complete and tested in production.**

## Appendix B: D1 Schema for Groups, Orders, Jobs

### groups

```sql
CREATE TABLE groups (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  secret_key  TEXT NOT NULL,
  admin_id    TEXT NOT NULL,
  admin_name  TEXT NOT NULL,
  rules       TEXT NOT NULL DEFAULT '{}',  -- JSON
  is_active   INTEGER DEFAULT 1,
  member_count INTEGER DEFAULT 0,
  max_members INTEGER,
  active_start_date TEXT,
  active_end_date TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE INDEX idx_groups_admin ON groups(admin_id);
```

### group_memberships

```sql
CREATE TABLE group_memberships (
  id          TEXT PRIMARY KEY,  -- groupId_userId composite
  group_id    TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  user_email  TEXT NOT NULL,
  user_name   TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'approved',  -- 'pending'|'approved'|'rejected'|'suspended'
  role        TEXT NOT NULL DEFAULT 'member',
  joined_at   TEXT NOT NULL DEFAULT (datetime('now')),
  approved_by TEXT,
  approved_at TEXT,
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_members_group ON group_memberships(group_id);
CREATE INDEX idx_members_user ON group_memberships(user_id);
```

### orders

```sql
CREATE TABLE orders (
  id              TEXT PRIMARY KEY,
  order_number    TEXT NOT NULL UNIQUE,
  customer_name   TEXT NOT NULL,
  contact         TEXT NOT NULL,
  product_type    TEXT NOT NULL,    -- 'wood_card'|'metal_card'
  payment_option  TEXT NOT NULL,    -- 'online_discount'|'later_manual'
  price           REAL NOT NULL,
  status          TEXT NOT NULL DEFAULT 'new',  -- 'new'|'in_queue'|'programming'|'qa_pending'|'completed'
  sales_rep_id    TEXT NOT NULL,
  sales_rep_name  TEXT NOT NULL,
  job_id          TEXT,
  commission_amount REAL DEFAULT 0,
  commission_unlocked INTEGER DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sales_rep_id) REFERENCES users(id)
);

CREATE INDEX idx_orders_salesrep ON orders(sales_rep_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### jobs

```sql
CREATE TABLE jobs (
  id            TEXT PRIMARY KEY,
  order_id      TEXT NOT NULL,
  order_number  TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  product_type  TEXT NOT NULL,
  stage         TEXT NOT NULL DEFAULT 'pending',  -- 'pending'|'programming'|'ready'
  wage          REAL DEFAULT 4,
  priority      TEXT DEFAULT 'normal',  -- 'low'|'normal'|'high'
  assigned_to   TEXT,
  nfc_locked    INTEGER DEFAULT 0,
  qa_video_url  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX idx_jobs_stage ON jobs(stage);
CREATE INDEX idx_jobs_order ON jobs(order_id);
```

### qr_sessions

```sql
CREATE TABLE qr_sessions (
  id              TEXT PRIMARY KEY,
  group_id        TEXT NOT NULL,
  group_name      TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  qr_data         TEXT NOT NULL DEFAULT '{}',  -- JSON
  is_active       INTEGER DEFAULT 1,
  attendance_type TEXT DEFAULT 'daily',
  valid_from      TEXT NOT NULL,
  valid_until     TEXT NOT NULL,
  scan_count      INTEGER DEFAULT 0,
  max_scans       INTEGER,
  created_by      TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_qr_sessions_group ON qr_sessions(group_id);
CREATE INDEX idx_qr_sessions_active ON qr_sessions(is_active);

### join_requests

```sql
CREATE TABLE join_requests (
  id            TEXT PRIMARY KEY,
  group_id      TEXT NOT NULL,
  group_name    TEXT NOT NULL,
  admin_id      TEXT,
  user_id       TEXT NOT NULL,
  user_email    TEXT NOT NULL,
  user_name     TEXT NOT NULL,
  employee_id   TEXT NOT NULL,
  secret_key    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending'|'approved'|'rejected'
  requested_at  TEXT NOT NULL DEFAULT (datetime('now')),
  processed_at  TEXT,
  processed_by  TEXT,
  admin_message TEXT,
  FOREIGN KEY (group_id) REFERENCES groups(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_join_requests_admin ON join_requests(admin_id, status);
CREATE INDEX idx_join_requests_group ON join_requests(group_id);
```

### nfc_status

```sql
CREATE TABLE nfc_status (
  id          TEXT PRIMARY KEY,  -- Same as jobId
  job_id      TEXT NOT NULL UNIQUE,
  locked      INTEGER DEFAULT 0,
  locked_at   TEXT,
  locked_by   TEXT,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);
```

### qa_videos

```sql
CREATE TABLE qa_videos (
  id          TEXT PRIMARY KEY,
  job_id      TEXT NOT NULL,
  order_id    TEXT NOT NULL,
  video_url   TEXT NOT NULL,
  recorded_by TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX idx_qa_videos_job ON qa_videos(job_id);
```

### payouts

```sql
CREATE TABLE payouts (
  id            TEXT PRIMARY KEY,
  sales_rep_id  TEXT NOT NULL,
  amount        REAL NOT NULL,
  paid_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sales_rep_id) REFERENCES users(id)
);

CREATE INDEX idx_payouts_salesrep ON payouts(sales_rep_id);
```

---

## Appendix C: Files That Call FirebaseService (Migration Checklist)

This is the complete list of files that need to be updated. Check them off as you go:

### Phase 1 (Wrapper — change imports)

- [ ] `services/firebaseService.ts` → Split into adapters, keep as fallback
- [ ] `contexts/AuthContext.tsx` — Uses `FirebaseService.onAuthStateChanged`, `getUserProfile`, `login`, `register`, `logout`
- [ ] `contexts/NotificationContext.tsx` — Uses `subscribeNotifications`, `createNotification`, `markNotificationRead`, etc.

### Phase 3 (Users + Auth)

- [ ] `app/auth/login.tsx` → Use `api.users.login()`
- [ ] `app/auth/register.tsx` → Use `api.users.register()`
- [ ] `app/auth/reset-password.tsx` → Use `api.users.resetPassword()`

### Phase 4 (Attendance)

- [ ] `app/qr-scanner.tsx` — Uses `validateAndRecordAttendance`, `createJoinRequest`
- [ ] `app/admin/groups.tsx` — Uses `subscribeAdminGroups`, `createGroup`, `getGroupMembers`
- [ ] `app/admin/join-requests.tsx` — Uses `subscribeJoinRequests`, `processJoinRequest`

### Phase 5 (Notifications — polling)

- [ ] `app/notifications.tsx` — Notification list screen

### Phase 6 (Orders + Jobs)

- [ ] `app/(sales)/index.tsx` — Uses `subscribeSalesOrders`
- [ ] `app/(sales)/orders.tsx` — Uses `subscribeSalesOrders`
- [ ] `app/(sales)/new-order.tsx` — Uses `createSalesOrder`
- [ ] `app/(sales)/payouts.tsx` — Uses `getSalesPayoutSummary`
- [ ] `app/(printer)/queue.tsx` — Uses `subscribePrinterJobs`
- [ ] `app/(printer)/wages.tsx` — Uses `subscribePrinterJobs`
- [ ] `app/(printer)/nfc/[jobId].tsx` — Uses `subscribePrinterJobs`, `lockJobChip`
- [ ] `app/(printer)/qa/[jobId].tsx` — Uses `subscribePrinterJobs`, `uploadQaVideo`

### Phase 7 (Storage)

- [ ] Already covered: QA screen uses `uploadQaVideo`

---

## Quick Start (TL;DR)

```bash
# Step 1: Create the service wrapper (in your RN app)
mkdir services/adapters
touch services/api.ts services/apiConfig.ts

# Step 2: Create the Worker project (separate folder)
cd ..
npx create-cloudflare@latest qrscanner-worker
cd qrscanner-worker
npx wrangler d1 create qrscanner-db

# Step 3: Apply schema
npx wrangler d1 migrations apply qrscanner-db

# Step 4: Seed users from Firebase
# (Run seed-users.ts script)

# Step 5: Toggle users flag to 'd1'
# (In apiConfig.ts)

# ✅ Users are now on D1!
# Repeat steps 4-5 for attendance → notifications → orders → storage
```

> **Remember:** Each phase is independent. You can stop at any point and the app still works with Firebase for the unmigrated features.
</final_file_content>

IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.
