# Damon Service - Project Management System

Internal web application for project management and pricing built with React, TypeScript, and Google Apps Script backend.

## Architecture

This application uses:
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Google Apps Script Web App (Google Sheets as database)
- **Proxy Server**: Express.js (handles CORS and token security)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Apps Script Web App deployed and accessible

## Google Apps Script Setup

### Step 1: Create Google Sheet
1. Create a new Google Sheet
2. Create the following 11 tabs with exact names:
   - **users**
   - **categories**
   - **devices**
   - **settings**
   - **projects**
   - **project_status_history**
   - **project_comments**
   - **project_inquiries**
   - **inquiry_prices_snapshot**
   - **sessions**
   - **audit_logs**

### Step 2: Configure Users Tab
In the "users" tab, add column headers in the first row:
```
id | username | password_salt | password_hash_sha256 | full_name | role (admin / sales_manager / employee) | is_active (TRUE/FALSE)
```

Then add the default admin user in the second row (passwords are hashed with SHA256 salt):
```
u-admin | admin | [empty] | [empty] | مدیر سیستم | admin | TRUE
```

After deploying the Apps Script, run the `bootstrap_setAdminPassword()` function in the Apps Script editor to set admin password to `sasan123`.

### Step 3: Configure Settings Tab
In the "settings" tab, add these column headers:
```
id | discount_multiplier (D) | freight_rate_per_meter_eur (F) | customs_numerator (CN) | customs_denominator (CD) | warranty_rate (WR) | commission_factor (COM) | office_factor (OFF) | profit_factor (PF) | rounding_mode | rounding_step | exchange_rate_irr_per_eur | is_active (TRUE/FALSE)
```

### Step 4: Configure Other Tabs

**devices:**
```
id | model_name | category_id | factory_pricelist_eur (P) | length_meter (L) | weight_unit (W) | is_active (TRUE/FALSE)
```

**categories:**
```
id | category_name | description | is_active (TRUE/FALSE)
```

**projects:**
```
id | created_by_user_id | assigned_sales_manager_id | project_name | employer_name | project_type (مسکونی/اداری/تجاری/…) | address_text | tehran_lat | tehran_lng | additional_info | status (pending_approval/approved/rejected/…) | approval_decision_by | approval_decision_at | approval_note | created_at | updated_at
```

**project_status_history:**
```
id | project_id | changed_by_user_id | from_status | to_status | note | created_at
```

**project_comments:**
```
id | project_id | author_user_id | author_role_snapshot | body | parent_comment_id | created_at
```

**project_inquiries:**
```
id | project_id | requested_by_user_id | device_id | category_id | quantity | query_text_snapshot | settings_id_snapshot | created_at
```

**inquiry_prices_snapshot:**
```
id | project_inquiry_id | sell_price_eur_snapshot | sell_price_irr_snapshot | created_at
```

**sessions:**
```
token | user_id | expires_at (ISO datetime) | is_active (TRUE/FALSE) | ip_address | user_agent | created_at
```

**audit_logs:**
```
id | actor_user_id | action_type | project_id | project_inquiry_id | meta_json | ip_address | user_agent | created_at
```

### Step 5: Deploy to Google Apps Script
1. Open your Google Sheet
2. Go to **Extensions** > **Apps Script**
3. Copy the entire code from `google-script-template.js` file in the project
4. Paste it into the Apps Script editor (replace all existing code)
5. In the Apps Script editor, go to **Project Settings** and set these Script Properties:
   - `SPREADSHEET_ID`: Your Google Sheet ID (found in the Sheet URL)
   - `TOKEN_TTL_HOURS`: 24 (token expires in 24 hours)
6. Click **Deploy** > **New Deployment**
7. Select type: **Web app**
8. Set "Execute as" to your Google account
9. Set "Who has access" to **Anyone**
10. Click Deploy and copy the generated Web App URL

### Step 6: Initialize Admin Password
1. In the Apps Script editor, find the `bootstrap_setAdminPassword()` function
2. Click the play button to execute it (you may need to authorize)
3. This sets the admin password hash to `sasan123`

### Step 7: Configure the Frontend App
1. Paste the Web App URL into the `GAS_BASE_URL` constant in `server.ts` (around line 8)
2. The app is now ready to use

Your Google Apps Script backend will be deployed with the following base URL pattern:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## Installation

1. Extract the project files
2. Install dependencies:
```bash
npm install
```

## Running the Application

You need to run TWO servers:

### 1. Start the Express Proxy Server (Terminal 1)
```bash
npm run server
```
This starts the proxy server on port 3001 that handles all Google Apps Script API calls.

### 2. Start the Frontend Dev Server (Terminal 2)
```bash
npm run dev
```
This starts the Vite development server on port 5173.

### 3. Access the Application
Open your browser and navigate to:
```
http://localhost:5173
```

## Default Login Credentials

After running `bootstrap_setAdminPassword()`:

**Admin:**
- Username: `admin`
- Password: `sasan123`

For other users, you can add them to the users tab or set their passwords via the admin panel using `/admin/users/set_password` endpoint.

## Features

### For Employees
- Create new projects with Tehran map location
- View own projects
- Request price quotes (after project approval)
- Add comments to projects
- View project timeline and status

### For Sales Managers
- View all projects
- Approve/reject projects
- View price inquiries including factory pricelist
- View all projects on map
- Manage project status

### For Admin
- Full system access
- View all projects and inquiries
- User password management
- Map overview with filters
- System settings (via Google Sheets)

## API Endpoints

All API endpoints are proxied through the Express server to avoid CORS issues and keep tokens secure:

- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `GET /api/me` - Get current user
- `GET /api/projects/list` - List projects
- `POST /api/projects/create` - Create project
- `GET /api/projects/detail` - Get project details
- `POST /api/projects/approve` - Approve project
- `POST /api/projects/reject` - Reject project
- `GET /api/categories/list` - List categories
- `GET /api/devices/search` - Search devices
- `POST /api/inquiries/quote` - Request price quote
- `POST /api/comments/add` - Add comment
- `POST /api/admin/users/set_password` - Set user password (admin only)

## Security

- **Password Security**: SHA256 hashing with random salt per user
- **Token-based Authentication**: JWT-like tokens with 24-hour TTL
- **HttpOnly Cookies**: Tokens not stored in localStorage
- **Server-side Proxy**: Prevents token exposure to frontend
- **Role-Based Access Control (RBAC)**: Three roles (admin, sales_manager, employee)
- **Row-level Security**: Backend enforces data access based on user role and ownership
- **Audit Logging**: All major actions logged with timestamp, user, IP, and user agent
- **Session Management**: Active session tracking with expiration
- **CORS Protection**: Proxy server handles all API communication

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Technology Stack

- React 19
- TypeScript 5
- Vite 6
- TailwindCSS 3
- React Router 7
- Zustand (state management)
- Leaflet (maps)
- Express.js (proxy server)
- Lucide React (icons)

## Project Structure

```
src/
├── components/         # Reusable components
│   └── Layout.tsx     # Main layout with sidebar
├── pages/             # Page components
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── ProjectList.tsx
│   ├── ProjectCreate.tsx
│   ├── ProjectDetails.tsx
│   ├── MapOverview.tsx
│   └── admin/         # Admin pages
├── services/
│   └── api.ts         # API client and state management
├── lib/
│   ├── types.ts       # TypeScript types
│   ├── pricing.ts     # Pricing calculations
│   └── mock-db.ts     # Mock data (for reference)
└── App.tsx            # Main app component

server.ts              # Express proxy server
```

## Notes

- The app requires both the frontend and proxy server to be running
- All API calls go through the proxy server for security
- The Google Apps Script URL is hardcoded in server.ts
- For production deployment, consider environment variables for configuration
