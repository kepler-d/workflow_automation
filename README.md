# Workflow Automation Platform

A powerful, visual workflow automation engine inspired by tools like Zapier, Make, and n8n. Build dynamic, multi-step automations using a drag-and-drop canvas, and execute them reliably in the background.

## 🚀 Features

- **Visual Workflow Builder**: An intuitive, node-based drag-and-drop interface powered by React Flow.
- **Multiple Triggers**:
  - **Webhooks**: Instantly trigger workflows via unique, auto-generated webhook URLs.
  - **Schedules (Cron)**: Run workflows autonomously on recurring time-based schedules (e.g., daily at 9 AM).
- **Dynamic Node Types**:
  - **HTTP Request**: Send automated API requests to any external service.
  - **IF Condition**: Branch your workflow logic dynamically (True/False) by evaluating deep payload data.
  - **Email**: Send automated emails with context-aware templating (e.g., `{{payload.user.email}}`).
  - **Delay**: Pause execution for a specified number of seconds.
  - **Console Log**: Output data for debugging.
- **Scalable Background Execution**: Workflows are offloaded to a dedicated Worker process via BullMQ and Redis, ensuring the API remains blazing fast.
- **Resilience & Retries**: Failed nodes automatically retry with exponential backoff.
- **Execution History**: Full observability with a detailed history UI tracking the success/failure and exact logs of every node execution.

## 🏗️ Architecture

The platform is split into a microservices-style architecture for local development:

1. **Frontend**: React + Vite + TailwindCSS + React Flow
2. **Backend API**: Node.js + Express + MongoDB (Serves the UI, handles webhooks, and enqueues jobs)
3. **Backend Worker**: Node.js + BullMQ (A dedicated process that listens to Redis and heavily processes the execution graph)
4. **Redis**: Used by BullMQ for robust job queueing and background task management.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, React Flow, Tailwind CSS, Lucide Icons, Axios, React Router.
- **Backend**: Node.js, Express, MongoDB (Mongoose), BullMQ, IORedis, Node-Cron, Nodemailer, Zod.
- **Infrastructure**: Docker (for Redis).

## 💻 Local Setup & Development

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas URI)
- Docker Desktop (Required for running Redis)

### 1. Start Redis
Ensure Docker Desktop is running, then start the Redis container from the root directory:
```bash
docker-compose up -d
```

### 2. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Optional: SMTP Credentials for the Email Node
# If omitted, emails will be printed to the console (Simulated Mode)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Run the Application
To run the platform locally, you will need **three** separate terminal windows to simulate the microservices architecture:

**Terminal 1 (Frontend)**
```bash
cd frontend
npm run dev
```

**Terminal 2 (Backend API Server)**
```bash
cd backend
npm run dev
```

**Terminal 3 (Backend Worker Process)**
```bash
cd backend
npm run dev:worker
```

## 📝 Usage Guide

1. **Create an Account**: Register and log in to the dashboard.
2. **Build a Workflow**: Click "Create Workflow", give it a name, and enter the builder.
3. **Add Nodes**: Drag nodes from the left sidebar. Start with a Trigger (Webhook or Schedule), and connect it to action nodes like IF Conditions or HTTP Requests.
4. **Configure Nodes**: Click on the inputs inside the nodes to configure their specific settings (URLs, Cron strings, IF logic).
5. **Save & Execute**: Click "Save Workflow". If you used a webhook trigger, send a POST request to the provided webhook URL to watch your background worker process the graph!
