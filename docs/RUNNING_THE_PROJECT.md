# Running the Project

This guide explains how to set up, run, and deploy the Secret Hitler Engine project.

## Prerequisites
- **Node.js**: v20 or higher
- **npm**: Installed with Node
- **Git**: For version control

---

## 🏗️ Development Setup

The project uses a **monorepo-style** structure where the root contains the server and `client/` contains the frontend. We use `concurrently` to run both at once.

### 1. Installation
Install dependencies for **both** the root (server) and client.

```bash
# Root (Server) dependencies
npm install

# Client dependencies
cd client
npm install
cd ..
```

### 2. Environment Variables

#### Server (`.env`)
Create a `.env` file in the **root** execution directory.

```ini
# Port for the WebSocket server
PORT=8080

# Redis Configuration
# Option A: MOCK REDIS (Recommended for local dev)
USE_MOCK_REDIS=true

# Option B: REAL REDIS (If you have a local Redis instance)
# USE_MOCK_REDIS=false
# REDIS_URL=redis://localhost:6379
```

#### Client (`client/.env`)
Create a `.env` file in `client/` (optional if using defaults).

```ini
# URL of the WebSocket server
VITE_WS_URL=ws://localhost:8080
```

### 3. Running the Project
Start both the Backend (Node/ts-node) and Frontend (Vite) with one command:

```bash
npm run dev
```

- **Server**: Runs on [http://localhost:8080](http://localhost:8080) (WebSocket)
- **Client**: Runs on [http://localhost:5173](http://localhost:5173)

**Controls:**
- The command prompt will show logs for both.
- Press `Ctrl+C` to stop both servers.

---

## 🚀 Production Deployment

In production, we compile TypeScript to JavaScript and run the optimized build.

### 1. Build
Compile both the server and client.

```bash
npm run build:all
```
*This runs `tsc` for the server and `vite build` for the client.*

### 2. Environment Variables (Production)
Ensure these environment variables are set in your deployment platform (e.g., Railway, Heroku, AWS).

- `NODE_ENV`: `production`
- `PORT`: `8080` (or platform default)
- `REDIS_URL`: `redis://user:password@host:port` (Required in production!)
- `USE_MOCK_REDIS`: `false` (Do not use mock in production)

### 3. Start Server
Run the compiled JavaScript server.

```bash
npm start
```

### 4. Serving the Client
The client build is output to `client/dist`.
- **Option A (Separate Host)**: Deploy `client/dist` to Netlify, Vercel, or AWS S3.
- **Option B (Nginx/Server)**: Serve `client/dist` as static files using Nginx or a static file server alongside the Node backend.

---

## 🛠️ Scripts Reference

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Server & Client in development mode |
| `npm run build` | Compiles Server TypeScript only |
| `npm run build:client` | Compiles Client (Vite) only |
| `npm run build:all` | Compiles Server & Client |
| `npm start` | Runs the compiled Server (`dist/server/index.js`) |
