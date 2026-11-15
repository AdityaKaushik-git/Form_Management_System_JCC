# JCC Reappear Examination Form Management System

**Institution:** JCC, Rohini Sector 3, Delhi, India  
**Application:** Reappear Examination Form Management System  
**Designed by:** Aditya Kaushik  

---

## 1. Overview & Architecture

The **JCC Reappear Examination Form Management System** is an enterprise-grade college ERP solution engineered for handling student reappear examination cycles. It combines a dynamic, code-free examination form builder with multi-spreadsheet Google Sheets synchronization, real-time Socket.IO status updates, and MariaDB ACID transaction integrity.

```
                  Student & Administrator Browsers
                                |
                                v
               React 18 + Vite + Tailwind CSS Frontend
                                |
                                v (REST / WebSockets)
                      Express.js API Gateway
                    (JWT, Argon2id, Zod, Helmet)
                                |
       +------------------------+-----------------------+
       |                        |                       |
       v                        v                       v
MariaDB Relational DB       Socket.IO             BullMQ Queue
(Primary Source of Truth)   Real-time Hub               |
                                                        v
                                                   Redis Store
                                                        |
                                                        v
                                                 Background Worker
                                                        |
                                                        v
                                              Google Sheets API v4
                                          (Multiple Department Sheets)
```

---

## 2. Key Features

- **Open Student Registration & Security:** Open signup without requiring pre-uploaded enrollment lists. Argon2id password hashing, progressive lockout protection, and JWT rotation in `HttpOnly` secure cookies.
- **Academic Management Hierarchy:** Flexible configuration of Courses (e.g. BCA, MCA, B.Tech), Batches (e.g. BCA 2024–2027), Semesters, and Subjects with batch-wise syllabus code variations.
- **Dynamic Examination Form Builder:**
  - Create forms without modifying application source code.
  - Supports text, number, email, mobile, textarea, dropdown, radio, checkbox, date, and info fields.
  - Live form preview mode.
- **Scheduling & Permanent Active Mode:**
  - Timezone-aware scheduling (`Asia/Kolkata`).
  - Upcoming, Active, and Closed automatic transitions.
  - **Permanent Active Mode:** When enabled, forms remain active indefinitely past the start date until manually closed.
  - Manual closure override controls.
- **Multiple Google Sheets Integration:**
  - Connect multiple Google Sheets per form (e.g., Examination Department Sheet, Accounts Sheet, Student Contact Sheet).
  - Custom column mapping interface per sheet with custom spreadsheet headers.
  - Asynchronous BullMQ background worker synchronization.
  - Idempotent row updates preventing duplicate entries on job retry using reference numbers (`JCC-RE-YYYYMMDD-XXXXX`).
  - **Sync All Previous Submissions** for newly attached spreadsheets.
- **Real-Time Dashboards:** Real-time counters, Recharts submission trends, and live activity streams powered by Socket.IO.
- **Official PDF Receipts:** Tamper-proof downloadable PDF receipts powered by PDFKit with JCC branding.
- **Reports & Data Export:** Filtered reports with instant Excel (`.xlsx`) export via ExcelJS and CSV export.

---

## 3. Technology Stack

- **Frontend:** React 18, Vite, React Router DOM v6, Tailwind CSS, Lucide React, React Hook Form, Zod, Recharts, Axios, Socket.IO Client.
- **Backend:** Node.js (ES Modules), Express.js, Sequelize ORM, MariaDB, Socket.IO, BullMQ, ioredis, Argon2id, JWT, Helmet, express-rate-limit, cookie-parser, PDFKit, ExcelJS.
- **External Integrations:** Google Sheets API v4 with Google Cloud Service Account, Nodemailer (SMTP).
- **Deployment:** Render Static Site (Frontend), Render Web Service (Backend), Render Background Worker (BullMQ), Managed MariaDB, Redis.

---

## 4. Local Installation & Development

### Prerequisites
- Node.js >= 18.x
- MariaDB Server >= 10.6 (or MySQL 8.0)
- Redis Server >= 6.x

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/jcc-reappear-exam-system.git
cd jcc-reappear-exam-system
```

### Step 2: Install Dependencies
```bash
# Install root, backend, and frontend packages
npm run install:all
```

### Step 3: Configure Environment Variables

**Backend (`backend/.env`):**
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database (MariaDB)
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_NAME=jcc_reappear_exam
DATABASE_USER=root
DATABASE_PASSWORD=your_mariadb_password

# JWT & Cookies
JWT_ACCESS_SECRET=your_super_secret_access_key_min_32_characters
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_characters
COOKIE_SECRET=your_super_secret_cookie_key_min_32_characters

# Redis
REDIS_URL=redis://localhost:6379

# Google Sheets Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=jcc-sheets-service@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...==\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=your-google-project-id

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@jcc.edu.in
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM="JCC Examination Branch <noreply@jcc.edu.in>"

# Admin Provisioning Secret
ADMIN_SETUP_SECRET=jcc_admin_secret_setup_token_2026
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000
```

### Step 4: Run Database Migrations & Seeders
```bash
cd backend
# Run migration to create 23 relational tables
npm run migrate

# Seed initial system settings
npm run seed
```

### Step 5: Provision Initial Administrator Account
```bash
cd backend
npm run admin:create -- --email admin@jcc.edu.in --password SecureAdminPass123! --name "Administrator"
```

### Step 6: Start Application Services
Open separate terminal sessions:

```bash
# Terminal 1: Backend Express Server
cd backend && npm run dev

# Terminal 2: BullMQ Background Worker
cd backend && npm run worker:dev

# Terminal 3: Vite React Frontend
cd frontend && npm run dev
```

The frontend will run at `http://localhost:5173`.  
The backend REST API will run at `http://localhost:5000`.

---

## 5. Google Sheets API Configuration Guide

To enable automated synchronization with college department Google Sheets:

1. **Google Cloud Console:**
   - Create a project: `JCC Examination Management`.
   - Enable the **Google Sheets API**.
   - Navigate to **IAM & Admin > Service Accounts** and create a service account (e.g. `jcc-sheets-service@...`).
   - Click on the service account, navigate to **Keys > Add Key > Create new key > JSON**.
   - Copy `client_email` and `private_key` into your backend `.env`.

2. **Sharing Spreadsheets with Service Account:**
   - Create or open your Google Spreadsheet (e.g. "Dec 2026 Reappear - Exam Branch").
   - Click **Share** (top-right).
   - Add the service account email as **Editor**.
   - Copy the spreadsheet URL and paste it into the admin panel's **Connect Google Spreadsheet** dialog.

---

## 6. Render Production Deployment

This project includes a declarative `render.yaml` blueprint for one-click deployment:

1. **Push your repository to GitHub.**
2. In the Render Dashboard, select **New > Blueprint** and link your GitHub repository.
3. Render automatically provisions:
   - **`jcc-reappear-api`** (Web Service): Runs `cd backend && npm install && npm start`.
   - **`jcc-reappear-worker`** (Background Worker): Runs `cd backend && npm install && npm run worker`.
   - **`jcc-reappear-frontend`** (Static Site): Builds `cd frontend && npm install && npm run build` and serves `frontend/dist` with SPA rewrite rules.
4. Add your production MariaDB credentials (from an external managed MariaDB provider such as Aiven, PlanetScale, or a dedicated VPS) and Redis connection URL in Render's Environment settings.

---

## 7. Testing & Verification Guide

| Test Scenario | Steps | Expected Result |
| :--- | :--- | :--- |
| **Student Registration** | Navigate to `/register`, enter details with enrollment number. | User and StudentProfile created; email verification sent. |
| **Duplicate Prevention** | Attempt registration with same enrollment or email. | 409 Conflict error with clear message. |
| **Admin Authentication** | Login at `/admin/login` with created admin credentials. | Issues JWT cookies and navigates to Admin Dashboard. |
| **Form Builder** | Create a form in `/admin/forms/create`, add custom dynamic fields. | Form and fields persisted in MariaDB. |
| **Permanent Active** | Toggle Permanent Active mode ON. | Form remains active indefinitely past the start date. |
| **Student Submission** | Fill application at `/student/forms/:id/apply`. | Generates `JCC-RE-YYYYMMDD-XXXXX` ref, queues sheet jobs. |
| **PDF Receipt** | Click "Download Receipt" after submission. | Instant PDF download with official layout and JCC header. |
| **Sheet Sync** | Check connected Google Sheet after submission. | Row appears in Google Sheet with formatted values. |
| **Sync All Previous** | Connect a new sheet and click "Sync All Previous Submissions". | All historical submissions synced without duplicates. |

---

## 8. License & Credits

© 2026 JCC Rohini, Sector 3, Delhi. All Rights Reserved.  
**Designed by Aditya Kaushik**
