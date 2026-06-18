# Driver Assignment & Trip Manager

A full-stack operational control dashboard for dispatchers and fleet administrators to manage drivers, vehicles, and active freight trips. Features real-time asset scheduling, automated compliance warnings, and proof-of-delivery sign-offs.

---

## Technical Stack

*   **Frontend**: React (Vite, TypeScript, SPA Routing, Vanilla CSS Design System)
*   **Backend**: Node.js + Express (ES Modules, Multer uploads, REST Routing)
*   **Database**: PostgreSQL
*   **Local Setup**: Docker Compose (PostgreSQL container containerized database)
*   **Testing**: Jest + Supertest (API integration and routing tests)

---

## Directory Structure

```
driver-trip-manager/
├── backend/            # Express.js API server
│   ├── src/            # Routes, database pool client, seed runners
│   ├── tests/          # Jest unit & integration test suites
│   ├── uploads/        # Local directory storing proof-of-delivery image files
│   └── Dockerfile      # Deployment configuration for backend
├── frontend/           # Vite + React client SPA
│   ├── src/            # Pages, API helpers, styles, layouts
│   └── .env            # Environment configurations (VITE_API_BASE_URL)
└── docker-compose.yml  # Local PostgreSQL service definition
```

---

## Local Setup & Run Instructions

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v16+)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local database orchestration)

### 2. Run Database Service
In the root directory, start the PostgreSQL container using Docker Compose:
```bash
docker compose up -d
```
*This starts a PostgreSQL instance listening on `localhost:5432` with username `postgres`, password `postgres`, and database name `driver_trip_manager`.*

### 3. Initialize & Seed Database
Navigate to the `/backend` directory and run the database setup and sample seeding:
```bash
cd backend
npm run seed
```
*This executes `schema.sql` which drops existing tables, creates the schemas for `drivers`, `vehicles`, `trips`, `pod`, and `trip_history`, and inserts sample mock assets with relative document compliance dates.*

### 4. Launch Backend API Server
While in the `/backend` folder, start the development server:
```bash
npm run dev
```
*The API server launches on [http://localhost:5000](http://localhost:5000). You can check health status via [http://localhost:5000/health](http://localhost:5000/health).*

### 5. Launch Frontend Application
Open a new terminal session, navigate to the `/frontend` directory, and start Vite:
```bash
cd frontend
npm run dev
```
*The client app boots on [http://localhost:5173](http://localhost:5173).*

---

## Running Automated Tests

To execute the Jest test suites verifying backend endpoints, input validations, and error payloads, run:
```bash
cd backend
npm run test
```

---

## Deployment Configuration

### 1. Backend (Render / Railway)
The backend includes a `Dockerfile`. To deploy to **Render**:
1. Create a **Web Service** pointing to your repository.
2. Set the build root directory to `backend`.
3. Select **Docker** as the environment (it will auto-detect the `/backend/Dockerfile`).
4. Add the following Environment Variable in Render:
   *   `DATABASE_URL`: Your hosted PostgreSQL connection string (e.g. Supabase, Neon, or Render DB).

### 2. Frontend (Vercel / Netlify)
To deploy the React client on **Vercel**:
1. Create a new project pointing to your repository.
2. Select `frontend` as the root directory.
3. Configure the build parameters:
   *   Build Command: `npm run build`
   *   Output Directory: `dist`
4. Declare the following Environment Variable in Vercel:
   *   `VITE_API_BASE_URL`: The URL of your deployed backend (e.g. `https://your-backend.onrender.com/api`).
