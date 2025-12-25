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

Your Google Apps Script backend should be deployed with the following base URL:
```
https://script.google.com/macros/s/AKfycbyWeH17Ut3BQEvbdLB13e7WerluTExLqZOut1XgFjlCS4W4d06dfwCP1y2lTos9hUy7/exec
```

The backend URL is configured in `server.ts` file.

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

Test the application with these credentials:

**Admin:**
- Username: `admin`
- Password: `sasan`

**Sales Manager:**
- Username: `sales`
- Password: `123`

**Employee:**
- Username: `emp1`
- Password: `123`

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

- Token-based authentication
- HttpOnly cookies (tokens not stored in localStorage)
- Server-side proxy prevents token exposure to frontend
- Role-based access control (RBAC)
- Row-level security through backend

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
