# Setup Guide

Follow these steps to set up and run the Blendwit CMS project locally.

## Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Docker & Docker Compose**: For running the PostgreSQL database

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cms
```

### 2. Run Automated Setup
The system includes a smart setup script that handles dependency installation, environment files, and database initialization.

```bash
npm run setup
```
> Select between **Manual** (using your local PostgreSQL) or **Docker** (to start a containerized database).

---

## Alternative Manual Installation
If you prefer to run steps individually:
1. `npm install`
2. `cp backend/.env.example backend/.env`
3. `docker-compose up -d`
4. `npm run db:init`
5. `npm run db:seed`

### 3. Environment Configuration
The backend requires a `.env` file for database connection and secrets. Templates have been provided as `.env.example` in both the root and child directories.

For a quick start, copy the backend example:
```bash
cp backend/.env.example backend/.env
```

**`backend/.env`**:
```env
DATABASE_URL="postgresql://admin:password123@localhost:5432/blendwit_cms?schema=public"
JWT_SECRET="supersercretkey123"
PORT=3001
```

### 4. Start Infrastructure
Run the database and pgAdmin using Docker Compose:
```bash
docker-compose up -d
```
> [!NOTE]
> This will start PostgreSQL on port `5432` and pgAdmin on port `5050`. The backend is configured to run on port `3001` by default to avoid conflicts with the frontend.

### 5. Initialize Database
Run Prisma migrations and seed the database with initial data (Super Admin, Roles, and CMS settings):
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

## Running the Application

You can start both the frontend and backend development servers from the root directory:

```bash
npm run dev
```

## Credential Distinction (Important)

During setup, you will encounter two different types of "admin" credentials. It is important to understand the difference:

### 1. Database Infrastructure (`admin`)
- **Purpose**: Used by the backend to connect to the PostgreSQL database.
- **Where**: Defined in `backend/.env` as `DATABASE_URL`.
- **Usage**: You generally do **not** type these into a login screen. They are for the system.

### 2. CMS Application (`superadmin@blendwit.com`)
- **Purpose**: Used for logging into the actual CMS dashboard.
- **Where**: These are shown below and seeded during `npm run db:seed`.
- **Usage**: Type these into the login form at `http://localhost:3000/login`.

---

### Resetting the Project

If you need to start from scratch (e.g., to test a fresh installation or clear all data), you can use the reset script:

```bash
npm run reset
```

**Warning**: This will delete all `node_modules`, build artifacts, `.env` files, and **completely wipe your database**.

---

## Accessing the System

- **Frontend (Next.js)**: [http://localhost:3000/login](http://localhost:3000/login)
- **Backend API (NestJS)**: [http://localhost:3001](http://localhost:3001)
- **Super Admin Credentials**:
    - **Email**: `superadmin@blendwit.com`
    - **Password**: `admin123`
    - *Note: You will be prompted to change your password on first login.*

## Troubleshooting

- **Database Connection Error (P1001)**: Ensure Docker is running and the containers are started with `docker-compose up -d`.
- **Backend Port Conflict**: If port `3001` is already in use, you can change the port in `backend/.env`.
- **Fetch Settings Failed**: Ensure the backend is running on port `3001`, as the frontend expects it there.
