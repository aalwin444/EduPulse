# EduPulse - Student Management System (SMS)

A complete, fully functional, and modern **Student Management System** built with **HTML5, CSS3, JavaScript (ES6+)**, powered by a **Node.js & Express** backend connected to **MongoDB**.

---

## 🚀 Features

- **Full CRUD Operations**:
  - **Create**: Add new students with complete details (Student ID, Name, Email, Phone, DOB, Gender, Department, Year, Semester, GPA, Status, Address).
  - **Read**: Display students in an interactive table with dynamic avatars, GPA indicators, and status badges.
  - **Update**: Edit any existing student record via a pre-filled responsive modal.
  - **Delete**: Remove student records with confirmation dialog.
- **MongoDB Database Integration**:
  - Persistent document storage via Mongoose ODM.
  - Live database health checker in header with visual indicator.
  - Automatic duplicate checks for Student ID and Email.
- **Real-time Analytics Dashboard**:
  - Live KPI cards: Total Students, Active Students, Departments Count, and Average GPA.
- **Search, Filtering & Sorting**:
  - Real-time search across Name, Student ID, Email, and Phone number.
  - Filter by Department and Enrollment Status (Active, Inactive, Graduated, Suspended).
  - Sort by Date, Name, Student ID, or GPA with ascending/descending toggle.
- **Data Export & Seeding**:
  - **Seed Demo Data**: One-click button to populate MongoDB with realistic sample student records.
  - **Export to CSV**: Download student records formatted as a spreadsheet.
- **User Interface**:
  - Clean SaaS dashboard aesthetic with CSS variables and responsive design.
  - Toast notification system for instant feedback on all operations.
  - Detailed student dossier profile modal.

---

## 📁 Project Structure

```text
project/
├── index.html         # Main user interface
├── style.css          # Design system, responsive layout, animations
├── script.js          # Client-side controller, API client, DOM rendering
├── server.js          # Node.js + Express backend with MongoDB connection
├── package.json       # Dependencies & scripts
└── .env               # Port and MongoDB Connection URI
```

---

## ⚙️ Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** (Local MongoDB Server running on default port `27017` or a MongoDB Atlas cloud URI)

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure MongoDB (Optional)
The default connection string is configured in `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/student_management_db
```
*(If using MongoDB Atlas, replace `MONGO_URI` with your connection string).*

### 3. Start the Server
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

### 4. Open in Browser
Visit **`http://localhost:5000`** in any web browser.

---

## GitHub Pages Preview

The repository deploys its static frontend to GitHub Pages whenever changes are pushed to `main`. After the first successful deployment, the site is available at:

`https://aalwin444.github.io/EduPulse/`

GitHub Pages serves static files only; it does not run the Express server or MongoDB. The dashboard's API-backed features and login therefore require the backend to be deployed separately. Do not use the Pages preview with real or sensitive data.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check MongoDB connection and server status |
| `GET` | `/api/stats` | Retrieve aggregate metrics (counts, average GPA) |
| `GET` | `/api/students` | List students (supports `search`, `department`, `status`, `sortBy`, `order`) |
| `GET` | `/api/students/:id` | Get single student details |
| `POST` | `/api/students` | Create new student record |
| `PUT` | `/api/students/:id` | Update existing student record |
| `DELETE` | `/api/students/:id` | Delete student record |
| `POST` | `/api/seed` | Populate MongoDB with demo student data |
