# Campus Resource Allocation System - Backend & MySQL Setup Guide

## 1. Prerequisites (XAMPP / MySQL)
1. Open **XAMPP Control Panel**.
2. Click **Start** next to **MySQL** (default port `3306`).
3. You can inspect the database anytime by opening **http://localhost/phpmyadmin** in your browser.

---

## 2. Running the System

### Start the Backend Server (Express + MySQL)
In Terminal 1:
```powershell
npm.cmd run server
```
- Server will run on: `http://localhost:5000`
- Database: Automatically initializes `campus_resource_db` with all tables and college resources!

### Start the Frontend Portal (React + Vite)
In Terminal 2:
```powershell
npm.cmd run dev
```
- Frontend will open on: `http://localhost:5173`

---

## 3. Database Schema Overview (`server/database/schema.sql`)
- **`users`**: Manages students and staff (ID, Name, Role, Department, Status).
- **`resources`**: Campus inventory (Labs, Classrooms, Halls, Equipment, Capacity, Facilities, Availability).
- **`bookings`**: Booking records with date/time, purpose, priority, approval status, and queue position.
- **`system_settings`**: Stores auto-approval mode and admin credentials.

---

## 4. API Endpoints
- `POST /api/auth/login` - Student & Admin authentication
- `GET /api/resources` - List all campus venues
- `POST /api/resources` - Add new campus venue
- `PUT /api/resources/:id` - Edit venue details
- `PATCH /api/resources/:id/toggle` - Toggle active/maintenance
- `DELETE /api/resources/:id` - Remove venue
- `GET /api/bookings` - List booking requests
- `POST /api/bookings` - Submit new booking with real-time clash validation
- `PATCH /api/bookings/:id/approve` - Approve booking
- `PATCH /api/bookings/:id/reject` - Reject booking with reason
- `PATCH /api/bookings/:id/cancel` - Student cancel request
- `GET /api/users` - Directory of registered students & faculty
