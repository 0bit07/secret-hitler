# Deployment Guide

## Overview

- **Server**: Deployed on Railway (Node.js). Needs to expose both WebSocket and HTTP Health Check.
- **Client**: Deployed on Netlify (Static Site). Needs to know where the server is.

## 1. Server (Railway)

### Environment Variables
Ensure these variables are set in your Railway project settings:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` (or let Railway assign it) | Port to listen on. Railway typically manages this. |
| `REDIS_URL` | `redis://...` | Connection string for Redis. If missing, set `USE_MOCK_REDIS=true`. |
| `USE_MOCK_REDIS`| `false` | Set to `true` if you don't have a Redis instance yet. |

### Health Check
Railway will look for a health check to know if the deployment succeeded.
- **Health Check Path**: `/health`
- **Method**: `GET`
- **Expected Status**: `200 OK`

## 2. Client (Netlify)

### Environment Variables
Netlify "Build & Deploy" > "Environment"

| Variable | Value | Description |
| :--- | :--- | :--- |
| `VITE_WS_URL` | `wss://<your-railway-app-url>` | **Crucial**: Must use `wss://` (Secure WebSocket) if your site is `https://`. |

> [!IMPORTANT]
> - If your Netlify site is `https://...`, you **MUST** use `wss://` for the backend URL.
> - If you use `ws://` on an HTTPS site, the browser will block the connection (Mixed Content Error).

### Build Settings
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
