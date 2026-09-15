# SOC Platform

A modern Security Operations Center (SOC) platform monorepo.

## Project Structure

```
soc-platform/
├── backend/    # Node.js + Express + TypeScript API server
├── frontend/   # React + Vite + TypeScript + Tailwind CSS client
└── shared/     # Shared real logs (LogHub Linux dataset) and MITRE data
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
   The backend API will be running on `http://localhost:5000` (Health check: `http://localhost:5000/health`).

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
   The frontend app will be running on `http://localhost:5173`.
